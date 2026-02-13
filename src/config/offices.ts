export interface Office {
  city: string;
  address: string;
  phone: string;
  email: string;
}

export const offices: Office[] = [
  {
    city: "Shanghai Headquarters",
    address:
      "88 Keyuan Road, Zhangjiang Hi-Tech Park, Pudong New Area, Shanghai",
    phone: "+86 21 5888 8888",
    email: "shanghai@company.com",
  },
  {
    city: "Beijing Office",
    address: "T1, Wanjing SOHO, Chaoyang District, Beijing",
    phone: "+86 10 5888 8888",
    email: "beijing@company.com",
  },
  {
    city: "Shenzhen Office",
    address: "8 Kefa Road, Nanshan District, Shenzhen",
    phone: "+86 755 8888 8888",
    email: "shenzhen@company.com",
  },
]; 