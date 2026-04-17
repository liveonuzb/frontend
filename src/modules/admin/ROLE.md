# Admin Module Role

## API Data Rule

- Admin modul ichida API-backed ma'lumotlar uchun Zustand store ishlatilmaydi.
- List, detail, create, edit, delete kabi barcha entity flow'lar ma'lumotni ishlatilayotgan container/page ichida React Query orqali oladi.
- Query uchun `useGetQuery`, mutation uchun `usePostQuery`, `usePatchQuery`, `useDeleteQuery`, kerak bo'lsa lokal API helper fayllari ishlatiladi.
- Query key va API helper'lar feature ichida saqlanadi, global store'ga ko'chirilmaydi.

## Allowed Exceptions

- `useAuthStore` faqat sessiya, token, role va current user access uchun.
- `useLanguageStore` faqat UI locale uchun.
- `useBreadcrumbStore` faqat breadcrumb UI state uchun.

## Forbidden Pattern

- `src/store/` ichida admin entity cache/store yaratish.
- Bir admin sahifada kerak bo'lgan API ma'lumotni boshqa admin sahifa store'ga yuklab, shu store'dan o'qish.
- Admin list/detail/create/edit flow'larini shared Zustand store orqali bog'lash.

## Preferred Pattern

- Har bir admin feature o'z `queryKey` va API helper'iga ega bo'ladi.
- Har bir admin route `pages/<feature>/index.jsx` orqali kiradi va page faqat tegishli container'ni render qiladi.
- Har bir admin feature root'i `containers/<feature>/index.jsx` bo'ladi; real view'lar `list`, `overview`, `create`, `edit`, `detail`, `tabs` kabi leaf papkalarga ajratiladi.
- `api.js`, `schema.js`, helper va query key'lar feature papkasi ichida saqlanadi.
- Edit sahifa list store'dan item qidirmaydi; kerak bo'lsa own detail endpoint'dan oladi.
- Create/update vaqtida upload va cleanup kabi yon logika feature ichidagi helper'da boshqariladi.
