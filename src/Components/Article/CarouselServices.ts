const API_BASE = process.env.REACT_APP_API_BASE;

export interface CarouselSlide {
    id: number;
    image: string;
    title?: string;
    subtitle?: string;
    link?: string;
    order: number;
    active: boolean;
    created_at?: string;
}

export const fetchCarouselSlides = async (): Promise<CarouselSlide[]> => {
    const response = await fetch(`${API_BASE}/carousel`);
    if (!response.ok) throw new Error("Failed to fetch carousel slides");
    return response.json();
};

export const createCarouselSlide = async (formData: FormData): Promise<CarouselSlide> => {
    const response = await fetch(`${API_BASE}/carousel`, {
        method: "POST",
        body: formData,
    });
    if (!response.ok) throw new Error("Failed to create carousel slide");
    return response.json();
};

export const updateCarouselSlide = async (id: number, formData: FormData): Promise<CarouselSlide> => {
    const response = await fetch(`${API_BASE}/carousel/${id}`, {
        method: "PUT",
        body: formData,
    });
    if (!response.ok) throw new Error("Failed to update carousel slide");
    return response.json();
};

export const deleteCarouselSlide = async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/carousel/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete carousel slide");
};
