import { NewOrderForm } from "./order.types";

export const initialOrderForm: NewOrderForm = {
  user_id: "",
  payment_method: "cash",
  status: "pending",
  notes: "",
  items: [],
  shipping_address: {
    id: "",
    fullName: "",
    phone: "",
    city: "",
    area: "",
    street: "",
    building: "",
    floor: "",
    apartment: "",
  },
  discountEnabled: false,
  discountType: "amount",
  discountValue: 0,
};
