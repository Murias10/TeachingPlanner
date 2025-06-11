import LetterGlitch from "@/components/LetterGlitch";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Start = () => {

    return (
        <>
            <LetterGlitch
                glitchColors={["#bbbbbb"]}
                glitchSpeed={300}
                centerVignette={true}
                outerVignette={true}
                smooth={true}
            >

                <div className="flex flex-col items-center mt-8 space-y-4">
                    <h1 className="text-6xl font-bold text-center">Planificador Docente</h1>
                    <div className="flex flex-row items-center m-10 gap-10">
                        <Button className="w-40 h-12  whitespace-normal overflow-hidden">
                            <Link to="/home">Iniciar sesión</Link>
                        </Button>

                        <Button className="w-40 h-12  whitespace-normal overflow-hidden">
                            <Link to="/about">Continuar como estudiante</Link>
                        </Button>
                    </div>

                </div>
            </LetterGlitch>
        </>);
};

export default Start;
