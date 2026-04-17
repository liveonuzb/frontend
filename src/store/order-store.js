import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { map, filter, reduce } from "lodash";

const STATUS_FLOW = ["accepted", "preparing", "shipped", "delivered"];

const STATUS_LABELS = {
  accepted: "Qabul qilindi",
  preparing: "Tayyorlanmoqda",
  shipped: "Jo'natildi",
  delivered: "Yetkazildi",
};

const STATUS_LABELS_DIGITAL = {
  accepted: "Qabul qilindi",
  preparing: "Tayyorlanmoqda",
  shipped: "Faollashtirilmoqda",
  delivered: "Faollashtirildi",
};

const useOrderStore = create()(
  persist(
    (set, get) => ({
      orders: [
        {
          id: "ORD-001",
          items: [{ id: 101, name: "Premium 1 oy", image: "👑", xp: 1000, price: 100000, quantity: 1, instant: true, category: "Obuna" }],
          totalXP: 1000,
          totalPrice: 100000,
          paymentMode: "xp",
          address: null,
          status: "delivered",
          type: "digital",
          date: "2025-02-10",
          review: null,
        },
        {
          id: "ORD-002",
          items: [{ id: 1, name: "LiveOn futbolka", image: "👕", xp: 500, price: 50000, quantity: 1, instant: false, category: "Kiyim" }],
          totalXP: 500,
          totalPrice: 50000,
          paymentMode: "xp",
          address: { name: "Ali Valiyev", phone: "+998901234567", region: "Toshkent", district: "Yunusobod", street: "Amir Temur, 15" },
          status: "shipped",
          type: "physical",
          date: "2025-02-05",
          review: null,
        },
      ],

      placeOrder: (orderData) => {
        const newOrder = {
          id: `ORD-${Date.now()}`,
          ...orderData,
          status: "accepted",
          date: new Date().toISOString().split("T")[0],
          review: null,
        };
        set({ orders: [newOrder, ...get().orders] });
        return newOrder.id;
      },

      addReview: (orderId, rating, comment) => {
        set({
          orders: map(get().orders, (o) =>
            o.id === orderId
              ? { ...o, review: { rating, comment, date: new Date().toISOString() } }
              : o
          ),
        });
      },

      getStatusLabel: (status, type) =>
        type === "digital"
          ? STATUS_LABELS_DIGITAL[status] ?? status
          : STATUS_LABELS[status] ?? status,

      getStatusIndex: (status) => STATUS_FLOW.indexOf(status),

      getStats: () => {
        const { orders } = get();
        return {
          total: orders.length,
          delivered: filter(orders, (o) => o.status === "delivered").length,
          totalXPSpent: reduce(orders, (s, o) => s + (o.paymentMode !== "money" ? (o.totalXP ?? 0) : 0), 0),
          totalMoneySpent: reduce(orders, (s, o) => s + (o.paymentMode !== "xp" ? (o.totalPrice ?? 0) : 0), 0),
        };
      },
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { STATUS_FLOW, STATUS_LABELS };
export default useOrderStore;
