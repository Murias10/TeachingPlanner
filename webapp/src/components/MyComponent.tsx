// src/components/MyComponent.tsx
import { useQuery } from "@tanstack/react-query";

const fetchData = async () => {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts/1");
    if (!response.ok) throw new Error("Error al cargar los datos");
    return response.json();
};

const MyComponent = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ["post"],
        queryFn: fetchData,
    });

    if (isLoading) return <p>Cargando...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h3>{data.title}</h3>
            <p>{data.body}</p>
        </div>
    );
};

export default MyComponent;
