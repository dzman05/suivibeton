import { onRequestGet as __api_formulations_js_onRequestGet } from "D:\\suivibeton\\functions\\api\\formulations.js"
import { onRequestPost as __api_login_js_onRequestPost } from "D:\\suivibeton\\functions\\api\\login.js"
import { onRequestGet as __api_production_js_onRequestGet } from "D:\\suivibeton\\functions\\api\\production.js"
import { onRequestPost as __api_production_js_onRequestPost } from "D:\\suivibeton\\functions\\api\\production.js"
import { onRequestGet as __api_users_js_onRequestGet } from "D:\\suivibeton\\functions\\api\\users.js"
import { onRequestPost as __api_users_js_onRequestPost } from "D:\\suivibeton\\functions\\api\\users.js"

export const routes = [
    {
      routePath: "/api/formulations",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_formulations_js_onRequestGet],
    },
  {
      routePath: "/api/login",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_login_js_onRequestPost],
    },
  {
      routePath: "/api/production",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_production_js_onRequestGet],
    },
  {
      routePath: "/api/production",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_production_js_onRequestPost],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_users_js_onRequestGet],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_users_js_onRequestPost],
    },
  ]