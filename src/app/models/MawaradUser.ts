export interface MawaradUser {
  items: Data[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface Data {
  id: number
  fullName: string
  email?: string
  userName: string
  phoneNumber: string
  employeeRank: string
  isActive: boolean
  createdAt: string
}
