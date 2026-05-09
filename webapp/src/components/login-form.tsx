// components/login-form.tsx
import { useState, FormEvent, ChangeEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RequiredLabel } from "@/components/ui/RequiredLabel"
import { Checkbox } from "@/components/ui/checkbox"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useFloatingAlertContext } from "@/contexts/useFloatingAlertContext"
import { useTranslation } from "react-i18next"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { triggerAlert } = useFloatingAlertContext();
  const { t } = useTranslation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validación básica
      if (!email || !password) {
        triggerAlert({
          title: t('login.validation.title'),
          description: t('login.validation.description'),
          variant: 'warning'
        });
        return;
      }

      const success = await login({ email, password, rememberMe });

      if (success) {
        triggerAlert({
          title: t('login.success.title'),
          description: t('login.success.description'),
          variant: 'success'
        });

        setTimeout(() => {
            navigate('/home', { replace: true });
        }, 800);
      } else {
        triggerAlert({
          title: t('login.invalidCredentials.title'),
          description: t('login.invalidCredentials.description'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('login.connectionError.description');
      triggerAlert({
        title: t('login.connectionError.title'),
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>{t('login.title')}</CardTitle>
          <CardDescription>
            {t('login.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <RequiredLabel htmlFor="email" required>{t('login.emailLabel')}</RequiredLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <RequiredLabel htmlFor="password" required>{t('login.passwordLabel')}</RequiredLabel>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer">
                  {t('login.rememberMe')}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('login.submitting') : t('login.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}