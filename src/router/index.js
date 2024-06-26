import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/img-srcset-sizes",
      component: () => import("../views/ImgSrcsetView.vue"),
    },
    {
      path: "/cainiao-print-demo",
      component: () => import("../views/CAI_NIAO_Print_View.vue"),
    },
  ],
});

export default router;
