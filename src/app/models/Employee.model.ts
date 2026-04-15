export interface EmployeeHierarchyResponse {
  data: Employee[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export interface Employee {
  categoryId: number;
  state: string;
  status: string;
  gender: string;
  profilePictureToken: string;
  jobPositionName?: any;
  workEmail: string;
  personalEmail?: string;
  phoneNumber: string;
  id: number;
  fullName: string;
  firstName: string;
  familyName: string;
  firstNameEn: string;
  lastNameEn: string;
  identityNumber: string;
}