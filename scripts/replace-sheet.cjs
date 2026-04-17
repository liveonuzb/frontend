const fs = require('fs');
const path = require('path');

const files = [
    "src/modules/coach/containers/workout-library/index.jsx",
    "src/modules/coach/containers/earnings/index.jsx",
    "src/modules/coach/containers/client-detail/index.jsx",
    "src/modules/coach/containers/programs/index.jsx",
    "src/modules/coach/containers/workout-plans/index.jsx",
    "src/modules/coach/containers/messages/index.jsx",
    "src/modules/coach/containers/clients/index.jsx",
    "src/modules/coach/containers/meal-plans/index.jsx",
    "src/modules/coach/containers/schedule/index.jsx",
    "src/modules/admin/containers/meal-plans/index.jsx",
    "src/modules/admin/containers/moderation/index.jsx",
    "src/modules/admin/containers/notifications/index.jsx",
    "src/modules/admin/containers/foods/index.jsx",
    "src/modules/admin/containers/exercises/index.jsx",
    "src/modules/admin/containers/recipes/index.jsx",
    "src/modules/admin/containers/users/index.jsx",
    "src/modules/admin/containers/coaches/index.jsx",
    "src/modules/admin/containers/subscriptions/index.jsx",
    "src/modules/admin/containers/workouts/index.jsx",
    "src/modules/admin/containers/food-categories/index.jsx",
    "src/modules/admin/containers/articles/index.jsx",
    "src/modules/admin/containers/banners/index.jsx",
    "src/modules/admin/containers/promo-codes/index.jsx",
    "src/modules/admin/containers/tickets/index.jsx",
    "src/components/chat/media-upload-dialog.jsx",
    "src/components/chat/forward-dialog.jsx",
    "src/components/ui/sidebar.jsx",
    "src/modules/user/containers/meal-plan/index.jsx",
    "src/modules/user/containers/workouts/index.jsx",
    "src/modules/user/containers/progress/index.jsx",
    "src/modules/user/containers/chat/index.jsx"
];

const workspace = "/Users/shoxruxshomurodov/Desktop/liveon-web";

for (const rel of files) {
    const absPath = path.join(workspace, rel);
    if (!fs.existsSync(absPath)) continue;

    let content = fs.readFileSync(absPath, 'utf8');

    // Replace imports
    content = content.replace(/@\/components\/ui\/sheet/g, '@/components/ui/drawer');

    // Replace component names
    content = content.replace(/\bSheet\b/g, 'Drawer');
    content = content.replace(/\bSheetContent\b/g, 'DrawerContent');
    content = content.replace(/\bSheetHeader\b/g, 'DrawerHeader');
    content = content.replace(/\bSheetTitle\b/g, 'DrawerTitle');
    content = content.replace(/\bSheetDescription\b/g, 'DrawerDescription');
    content = content.replace(/\bSheetFooter\b/g, 'DrawerFooter');
    content = content.replace(/\bSheetTrigger\b/g, 'DrawerTrigger');
    content = content.replace(/\bSheetClose\b/g, 'DrawerClose');

    fs.writeFileSync(absPath, content);
}
console.log("Done replacing Sheet with Drawer.");
