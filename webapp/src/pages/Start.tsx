import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Start = () => {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/home")
        }
    }, [isAuthenticated, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold tracking-tight">
                        Teaching Planner
                    </CardTitle>
                    <CardDescription className="text-base">
                        Planificación académica simplificada
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Link to="/home" className="block">
                        <Button variant="outline" className="w-full" size="lg">
                            Continuar como invitado
                        </Button>
                    </Link>

                    <Link to="/login" className="block">
                        <Button className="w-full" size="lg">
                            Iniciar sesión
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}

export default Start
