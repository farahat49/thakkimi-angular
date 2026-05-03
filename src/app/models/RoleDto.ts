
export interface RolesData {
  items: Data[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}


export interface Data
{
    id: number;
    name:string;
    displayName:string;

}