import LetterGlitch from "@/components/LetterGlitch";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Start = () => {

    return (
        <>
            <div className="h-[calc(100svh)]!">
                <LetterGlitch
                    glitchColors={["#bbbbbb"]}
                    glitchSpeed={600}
                    centerVignette={true}
                    outerVignette={true}
                    smooth={true}
                >
                    <div className=" flex flex-col items-center justify-center text-white">
                        <h1 className="text-5xl font-bold text-center">Planificador Docente</h1>
                        <div className="flex flex-row items-center m-10 gap-6">
                            <Button className="w-38 h-12  whitespace-normal">
                                <Link to="/home">Continuar como docente</Link>
                            </Button>
                            <Button className="w-38 h-12  whitespace-normal">
                                <Link to="/about">Continuar como estudiante</Link>
                            </Button>
                        </div>
                    </div>
                </LetterGlitch>
            </div >
        </>
    );
};

export default Start;
