export type AllocationType = {
  allocation_type_id: number;
  display_allocation_type: string;
};

export type Keyword = {
  keyword_id: number;
  keyword: string;
  allocation_type_keywords: { allocation_type_id: number }[];
};
