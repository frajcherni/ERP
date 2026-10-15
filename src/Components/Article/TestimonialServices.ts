import { getImageUrl } from "../../helpers/url_helper";
export { getImageUrl };
const API_BASE = process.env.REACT_APP_API_BASE;

export interface Testimonial {
  id: number;
  image: string;
  name?: string | null;
  order: number;
  active: boolean;
  created_at?: string;
}

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const response = await fetch(`${API_BASE}/testimonials`);
  if (!response.ok) throw new Error("Failed to fetch testimonials");
  return response.json();
};

export const createTestimonial = async (formData: FormData): Promise<Testimonial> => {
  const response = await fetch(`${API_BASE}/testimonials`, { method: "POST", body: formData });
  if (!response.ok) throw new Error("Failed to create testimonial");
  return response.json();
};

export const updateTestimonial = async (id: number, formData: FormData): Promise<Testimonial> => {
  const response = await fetch(`${API_BASE}/testimonials/${id}`, { method: "PUT", body: formData });
  if (!response.ok) throw new Error("Failed to update testimonial");
  return response.json();
};

export const deleteTestimonial = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/testimonials/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete testimonial");
};
