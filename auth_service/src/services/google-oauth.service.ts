import { Repository } from 'typeorm';
import { User } from '@/entities/user.entity';
import { AppDataSource } from '@/config/data-source';
import crypto from 'crypto';

interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope: string;
    id_token?: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

export class GoogleOAuthService {
    private userRepository: Repository<User>;
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;
    private encryptionKey: string;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.clientId = process.env.GOOGLE_CLIENT_ID || '';
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI || '';
        this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    }

    getAuthorizationUrl(userId: string): string {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        const state = this.encryptState(userId);

        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent',
            state: state
        });

        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    async handleCallback(code: string, state: string): Promise<{ success: boolean; message: string }> {
        try {
            const userId = this.decryptState(state);
            if (!userId) {
                return { success: false, message: 'Invalid state parameter' };
            }

            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Exchange code for tokens
            const tokens = await this.exchangeCodeForTokens(code);
            if (!tokens) {
                return { success: false, message: 'Failed to exchange code for tokens' };
            }

            // Get user info from Google
            const googleUser = await this.getGoogleUserInfo(tokens.access_token);
            if (!googleUser) {
                return { success: false, message: 'Failed to get Google user info' };
            }

            // Store tokens encrypted
            user.googleAccessToken = this.encrypt(tokens.access_token);
            user.googleRefreshToken = tokens.refresh_token ? this.encrypt(tokens.refresh_token) : user.googleRefreshToken;
            user.googleId = googleUser.id;
            user.googleTokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
            user.googleCalendarSyncEnabled = true;

            await this.userRepository.save(user);

            return { success: true, message: 'Google account connected successfully' };
        } catch (error) {
            console.error('Error handling OAuth callback:', error);
            return { success: false, message: 'Failed to connect Google account' };
        }
    }

    async disconnectGoogleAccount(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return { success: false, message: 'User not found' };
            }

            // Revoke token if exists
            if (user.googleAccessToken) {
                try {
                    const accessToken = this.decrypt(user.googleAccessToken);
                    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
                        method: 'POST'
                    });
                } catch (revokeError) {
                    console.warn('Failed to revoke token:', revokeError);
                }
            }

            // Clear Google fields
            user.googleAccessToken = undefined;
            user.googleRefreshToken = undefined;
            user.googleId = undefined;
            user.googleTokenExpiry = undefined;
            user.googleCalendarSyncEnabled = false;

            await this.userRepository.save(user);

            return { success: true, message: 'Google account disconnected successfully' };
        } catch (error) {
            console.error('Error disconnecting Google account:', error);
            return { success: false, message: 'Failed to disconnect Google account' };
        }
    }

    async getGoogleStatus(userId: string): Promise<{ connected: boolean; email?: string; syncEnabled: boolean }> {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                return { connected: false, syncEnabled: false };
            }

            if (!user.googleId || !user.googleAccessToken) {
                return { connected: false, syncEnabled: false };
            }

            // Check if token is still valid
            const isTokenValid = user.googleTokenExpiry && new Date() < user.googleTokenExpiry;

            return {
                connected: true,
                syncEnabled: user.googleCalendarSyncEnabled
            };
        } catch (error) {
            console.error('Error getting Google status:', error);
            return { connected: false, syncEnabled: false };
        }
    }

    async refreshAccessToken(userId: string): Promise<string | null> {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user || !user.googleRefreshToken) {
                return null;
            }

            const refreshToken = this.decrypt(user.googleRefreshToken);

            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    refresh_token: refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                console.error('Failed to refresh token:', await response.text());
                return null;
            }

            const tokens: GoogleTokenResponse = await response.json();

            // Update stored tokens
            user.googleAccessToken = this.encrypt(tokens.access_token);
            user.googleTokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

            await this.userRepository.save(user);

            return tokens.access_token;
        } catch (error) {
            console.error('Error refreshing access token:', error);
            return null;
        }
    }

    async getValidAccessToken(userId: string): Promise<string | null> {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user || !user.googleAccessToken) {
                return null;
            }

            // Check if token needs refresh (5 minutes buffer)
            const needsRefresh = !user.googleTokenExpiry ||
                new Date(user.googleTokenExpiry.getTime() - 5 * 60 * 1000) < new Date();

            if (needsRefresh) {
                return await this.refreshAccessToken(userId);
            }

            return this.decrypt(user.googleAccessToken);
        } catch (error) {
            console.error('Error getting valid access token:', error);
            return null;
        }
    }

    private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse | null> {
        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    redirect_uri: this.redirectUri,
                    grant_type: 'authorization_code'
                })
            });

            if (!response.ok) {
                console.error('Token exchange failed:', await response.text());
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error exchanging code for tokens:', error);
            return null;
        }
    }

    private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                console.error('Failed to get user info:', await response.text());
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting Google user info:', error);
            return null;
        }
    }

    private encryptState(userId: string): string {
        const timestamp = Date.now();
        const data = JSON.stringify({ userId, timestamp });
        return this.encrypt(data);
    }

    private decryptState(state: string): string | null {
        try {
            const data = this.decrypt(state);
            const parsed = JSON.parse(data);

            // Check if state is not older than 10 minutes
            if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
                return null;
            }

            return parsed.userId;
        } catch {
            return null;
        }
    }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(16);
        const key = Buffer.from(this.encryptionKey.slice(0, 32).padEnd(32, '0'));
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    private decrypt(encryptedText: string): string {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const key = Buffer.from(this.encryptionKey.slice(0, 32).padEnd(32, '0'));
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
