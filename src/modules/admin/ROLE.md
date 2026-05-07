# Admin Module Role

## API Data Rule

- Admin modul ichida API-backed ma'lumotlar uchun Zustand store ishlatilmaydi.
- List, detail, create, edit, delete kabi barcha entity flow'lar ma'lumotni ishlatilayotgan container/page ichida React Query orqali oladi.
- Query uchun `useGetQuery`, mutation uchun `usePostQuery`, `usePatchQuery`, `useDeleteQuery`, kerak bo'lsa lokal API helper fayllari ishlatiladi.
- Mutation chaqiruvlari achievement patternida bo'ladi: `mutateAsync({ url, attributes, config })`.
- Query key va API helper'lar feature ichida saqlanadi, global store'ga ko'chirilmaydi.
- React Query cache API-backed entity data uchun source of truth bo'ladi.

## DataGrid Rule

- Barcha yangi yoki o'zgartirilayotgan admin API-backed tabular UI'lar DataGrid stack bilan qilinadi.
- Raw/custom table yaratmang; `src/components/reui/data-grid` komponentlaridan foydalaning.
- Admin list sahifalarda `AdminListPageShell`, `AdminListHeader`, `AdminListToolbar`, `AdminListDataGrid` ishlatiladi.
- Asosiy namuna: `src/modules/admin/containers/achievements/*`.
- Columnlar `list/columns.jsx` ichida bo'ladi; filter, action menu va delete alert kabi list-local UI `list/` ichida saqlanadi.
- Pagination, sorting va filterlar URL/query-state orqali boshqariladi; server-backed listlarda `useReactTable` manual pagination/sorting bilan ishlatiladi.
- DnD kerak bo'lsa achievementdagidek `DataGridTableDndRows` va `DataGridTableDndRowHandle` ishlatiladi.

## Allowed Exceptions

- `useAuthStore` faqat sessiya, token, role va current user access uchun.
- `useLanguageStore` faqat UI locale uchun.
- `useBreadcrumbStore` faqat breadcrumb UI state uchun.
- Drawer, selection va local draft kabi backend entity cache bo'lmagan UI state lokal store'da bo'lishi mumkin.

## Forbidden Pattern

- `src/store/` ichida admin entity cache/store yaratish.
- Bir admin sahifada kerak bo'lgan API ma'lumotni boshqa admin sahifa store'ga yuklab, shu store'dan o'qish.
- Admin list/detail/create/edit flow'larini shared Zustand store orqali bog'lash.
- API-backed listlar uchun raw `<table>` yoki feature-local custom table stack yaratish.
- Backend bilan to'g'ridan-to'g'ri `useApi`/axios requestlarini container ichida chaqirish; `@/hooks/api` query/mutation hooklaridan foydalaning.

## Preferred Pattern

- Har bir admin feature o'z `queryKey` va API helper'iga ega bo'ladi.
- Har bir admin route `pages/<feature>/index.jsx` orqali kiradi va page faqat tegishli container'ni render qiladi.
- Har bir admin feature root'i `containers/<feature>/index.jsx` bo'ladi; real view'lar `list`, `overview`, `create`, `edit`, `detail`, `tabs` kabi leaf papkalarga ajratiladi.
- `api.js`, `schema.js`, helper va query key'lar feature papkasi ichida saqlanadi.
- Edit sahifa list store'dan item qidirmaydi; kerak bo'lsa own detail endpoint'dan oladi.
- Create/update vaqtida upload va cleanup kabi yon logika feature ichidagi helper'da boshqariladi.
- Mavjud legacy table flow'lar alohida refactor task bo'lmasa majburan ko'chirilmaydi; lekin task shu flow'ga tegsa va yangi ish current patternni talab qilsa, AI o'sha task ichida flow'ni DataGrid + React Query patterniga migratsiya qiladi.
