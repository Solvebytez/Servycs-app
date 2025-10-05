import { tokenAuthApi } from "./api";

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive?: boolean;
  _count?: {
    children: number;
    services?: number;
  };
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export interface CategoryChildrenResponse {
  success: boolean;
  data: Category[];
  message: string;
}

export interface CategoryHasChildrenResponse {
  success: boolean;
  data: {
    hasChildren: boolean;
    childCount: number;
  };
  message: string;
}

export interface CategoryByIdResponse {
  success: boolean;
  data: Category & {
    parent?: {
      id: string;
      name: string;
      slug: string;
    };
    _count: {
      children: number;
      services: number;
    };
  };
  message: string;
}

// Category API service
export const categoryService = {
  // Get primary categories (top-level categories with no parent)
  getPrimaryCategories: async (): Promise<Category[]> => {
    const response = await tokenAuthApi.get("/categories/primary");
    const categories = (response.data as any).data;
    return categories;
  },

  // Get children of a specific category
  getCategoryChildren: async (categoryId: string): Promise<Category[]> => {
    const response = await tokenAuthApi.get(
      `/categories/${categoryId}/children`
    );
    const children = (response.data as any).data;
    return children;
  },

  // Check if a category has children
  checkCategoryHasChildren: async (categoryId: string): Promise<boolean> => {
    const response = await tokenAuthApi.get(
      `/categories/${categoryId}/has-children`
    );
    return (response.data as any).data.hasChildren;
  },

  // Get category by ID with full details
  getCategoryById: async (
    categoryId: string
  ): Promise<CategoryByIdResponse["data"]> => {
    const response = await tokenAuthApi.get(`/categories/${categoryId}`);
    return (response.data as any).data;
  },

  // Get all categories as flat list for client-side tree building
  getAllCategoriesFlat: async (): Promise<Category[]> => {
    const response = await tokenAuthApi.get("/categories/tree");
    return (response.data as any).data;
  },

  // Get full category tree (admin only - for future use)
  getCategoryTree: async (): Promise<CategoryWithChildren[]> => {
    const response = await tokenAuthApi.get("/categories/admin/tree");
    return (response.data as any).data;
  },

  // Search categories by query
  searchCategories: async (query: string): Promise<Category[]> => {
    const response = await tokenAuthApi.get(
      `/categories/search?q=${encodeURIComponent(query)}`
    );
    return (response.data as any).data;
  },
};

export default categoryService;
