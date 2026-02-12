export interface ProductDocument {
    id: string;
    score: number;
    score_original: number;
    boosted: boolean;
    document: {
        chunk_text: string;
        created_at: string;
        discount_price: number;
        id: string;
        images: string[];
        product_categories: string;
        product_name: string;
        product_sugar_level: string;
        promos: string;
        selling_price: number;
        store: string;
        updated_at: string;
        updated_by: string;
        vector_score: number;
    };
}

export interface InspirationDocument {
    id: string | null;
    score: number;
    document: {
        banner_content?: string;
        banner_share_thumbnail?: string;
        category?: string;
        chunk_text: string;
        cook_time?: number;
        description: string;
        difficulty?: string;
        image: string;
        portion?: string;
        title: string;
    };
}

export interface SearchResults {
    product: ProductDocument[];
    super_inspiration?: InspirationDocument[];
}

export interface Pagination {
    page: number;
    page_size: number;
    total_results: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface SearchResponse {
    success: boolean;
    query: string;
    results: SearchResults;
    pagination: Pagination;
}

export interface PopularSearch {
    term: string;
    count: number;
}

export interface PopularSearchResponse {
    success: boolean;
    results: PopularSearch[];
}

export interface CacheClearResponse {
    success: boolean;
    message: string;
}

export interface RecommendationProduct {
    id: string;
    score: number;
    document: {
        id: string;
        product_name: string;
        description: string;
        price: number;
        category: string;
        images: string[];
        product_sugar_level: string;
        product_tags: string[];
        store: string;
        promos: string;
        created_at: string;
        updated_at: string;
        updated_by: string;
        selling_price: number;
    };
}

export interface RecommendationResponse {
    success: boolean;
    user_id: string;
    source: string;
    history_used: string[];
    results: RecommendationProduct[];
}
