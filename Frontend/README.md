# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.




Your app follows this structure:

Frontend Flow:

Routes → Pages → Components → Hooks → Context → API → Backend

##
🔐 STEP 1: Authentication Flow
Files involved:
Auth.jsx
AuthContext.jsx
useAuth.jsx
AppRoutes.jsx

application Authentication  flow :
🔁 FLOW:
User enters login → Auth.jsx

→ calls login() from useAuth
→ AuthContext sends API request (axios)

→ receives token + user
→ stores token in localStorage
→ updates user state

→ AppRoutes checks user
→ redirects to dashboard

## 