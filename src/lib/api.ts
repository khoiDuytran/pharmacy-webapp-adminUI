import axios from 'axios';
import Cookies from 'js-cookie';

// const BASE_URL = "https://pharmacy-webapp-backend-uz5m.onrender.com";
const BASE_URL = "http://localhost:8080";

function getToken(): string | null {
  return Cookies.get("auth_token");
}

export function setToken(token: string) {
  Cookies.set("auth_token", token);
}

export function clearToken() {
  Cookies.remove("auth_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = getToken();

    if(token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
  (response) => {
    const res = response.data;

    if (!res.success) {
      return Promise.reject(new Error(res.message));
    }

    return res.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//Auth
export const authApi = {
    login: (data: {username: string, password: string}) => api.post("/api/auth/login", data),
    logout: () => api.post("/api/auth/logout"),
};

//Product
type ProductPayload = {
    manufacturerId: string;
    categoriesId: string;
    name: string;
    description: string;
    originalPrice: number;
    price: number;
    percentDiscount?: number;
    quantity: number;
    purchaseCount?: number;
    images?: File[];
};

function buildProductFormData(data: ProductPayload): { url: string; formData: FormData } {
    const params = new URLSearchParams({
        manufacturerId: data.manufacturerId,
        categoriesId: data.categoriesId,
        name: data.name,
        description: data.description,
        originalPrice: String(data.originalPrice),
        price: String(data.price),
        percentDiscount: String(data.percentDiscount ?? 0),
        quantity: String(data.quantity),
        purchaseCount: String(data.purchaseCount ?? 0),
    });

    const formData = new FormData();
    if (data.images && data.images.length > 0) {
        data.images.forEach((file) => formData.append("image", file));
    }

    return { url: `?${params.toString()}`, formData };
}

export const productsApi = {
    getAll: () => api.get("/api/product/get-all-products"),
    getById: (id: string) => api.get(`/api/product/${id}`),
    create: (data: ProductPayload) => {
        const { url, formData } = buildProductFormData(data);
        return api.post(`/api/product/create-product${url}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    update: (id: string, data: ProductPayload) => {
        const { url, formData } = buildProductFormData(data);
        return api.put(`/api/product/${id}${url}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    delete: (id: string) => api.delete(`/api/product/${id}`),
    search: (data: any) => api.get("/api/product/search", data),
};

//Manufacturer
export const manufacturerApi = {
    getAll: () => api.get("/api/manufacturer/get-all-manufacturer"),
    getById: (id: string) => api.get(`/api/manufacturer/${id}`),
     create: (data: { name: string; description: string; image?: File | null }) => {
        const formData = new FormData();
        if (data.image) formData.append("image", data.image);
        return api.post(
            `/api/manufacturer/create-manufacturer?name=${encodeURIComponent(data.name)}&description=${encodeURIComponent(data.description)}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    },
    update: (id: string, data: { name: string; description: string; image?: File | null }) => {
        const formData = new FormData();
        if (data.image) formData.append("image", data.image);
        return api.put(
            `/api/manufacturer/${id}?name=${encodeURIComponent(data.name)}&description=${encodeURIComponent(data.description)}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
    },
    delete: (id: string) => api.delete(`/api/manufacturer/${id}`),
};

//Category
export const categoriesApi = {
    getAll: () => api.get("/api/categories/get-all-categories"),
    create: (data: any) => api.post("/api/categories/create-categories", data),
    update: (id: string, data: any) => api.put(`/api/categories/${id}`, data),
    delete: (id: string) => api.delete(`/api/categories/${id}`),
};

//Orders
export const billApi = {
    getAll: () => api.get("/api/bill/get-all-bill"),
    getById: (id: string) => api.get(`/api/bill/${id}`),
    updateStatus: (id: string, status: number) => 
        api.put(`/api/bill/${id}/update-order-status`, null, {
            params: { orderStatus: status },
        }),
    updatePaymentStatus: (id: string, status: number) => 
        api.put(`/api/bill/${id}/update-payment-status`, null, {
            params: { paymentStatus: status },
        }),
}

//Users
export const usersApi = {
    getAll: () => api.get("/api/user/"),
    getById: (id: string) => api.get(`/api/user/${id}`),
}

//FlashSale
export const discountEventApi = {
    getAll: () => api.get("/api/discount-event/get-all-discount-event"),
    getById: (id: string) => api.get(`/api/discount-event/${id}`),
    update: (id: string, data: any) => api.put(`/api/discount-event/${id}`, data),
    addProductToEvent: (id: string, productId: string) => 
        api.put(`/api/discount-event/add-product-to-event`, null, {
            params: { eventId: id, productId: productId },
        }),
        removeProductFromEvent: (id: string, productId: string) =>
            api.put(`/api/discount-event/remove-product-to-event`, null, {
                params: { eventId: id, productId: productId},
            }),
    create: (data: any) => api.post("/api/discount-event/create-discount-event", data),
    delete: (id: string) => api.delete(`/api/discount-event/${id}`),
}

export const tagsApi = {
  getAll: () => api.get("/api/tag/get-all-tag"),
  update: (id: string, data: { enabled: boolean; order: number }) =>
    api.put(`/api/tag/${id}`, null, { params: { enabled: data.enabled, order: data.order } }),
};

export const sectionsApi = {
  getAll: () => api.get("/api/section/get-all-section"),
  update: (id: string, data: { enabled: boolean; order: number }) =>
    api.put(`/api/section/${id}`, null, { params: { enabled: data.enabled, order: data.order } }),
};