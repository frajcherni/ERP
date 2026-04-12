import React from "react";
import { Navigate } from "react-router-dom";

//Dashboard
import DashboardAnalytics from "../pages/DashboardAnalytics";
import DashboardCrm from "../pages/DashboardCrm";
import DashboardEcommerce from "../pages/DashboardEcommerce";
import DashboardJobs from "../pages/DashboardJob";

import DashboardCrypto from "../pages/DashboardCrypto";
import DashboardProject from "../pages/DashboardProject";
import DashboardNFT from "../pages/DashboardNFT";

//Calendar

//Chat

// Project
import ProjectList from "../pages/Projects/ProjectList";
import ProjectOverview from "../pages/Projects/ProjectOverview";
import CreateProject from "../pages/Projects/CreateProject";

//Task
import TaskDetails from "../pages/Tasks/TaskDetails";
import TaskList from "../pages/Tasks/TaskList";

//Transactions
import Transactions from "../pages/Crypto/Transactions";
import BuySell from "../pages/Crypto/BuySell";
import CryproOrder from "../pages/Crypto/CryptoOrder";
import MyWallet from "../pages/Crypto/MyWallet";
import ICOList from "../pages/Crypto/ICOList";
import KYCVerification from "../pages/Crypto/KYCVerification";

//Crm Pages

//Invoices

// Support Tickets

// //Ecommerce Pages
import EcommerceProducts from "../pages/Ecommerce/EcommerceProducts/index";
import EcommerceProductDetail from "../pages/Ecommerce/EcommerceProducts/EcommerceProductDetail";
import EcommerceAddProduct from "../pages/Ecommerce/EcommerceProducts/EcommerceAddProduct";
import EcommerceOrders from "../pages/Ecommerce/EcommerceOrders/index";
import WebSiteSettings from "../pages/Ecommerce/EcommerceOrders/WebSiteSettings";

import EcommerceOrderDetail from "../pages/Ecommerce/EcommerceOrders/EcommerceOrderDetail";
import EcommerceCustomers from "../pages/Ecommerce/EcommerceCustomers/index";
import EcommerceCart from "../pages/Ecommerce/EcommerceCart";
import EcommerceCheckout from "../pages/Ecommerce/EcommerceCheckout";
import EcommerceSellers from "../pages/Ecommerce/EcommerceSellers/index";
import EcommerceSellerDetail from "../pages/Ecommerce/EcommerceSellers/EcommerceSellerDetail";

import ApiKey from "../pages/APIKey/index";

// User Profile
import UserProfile from "../pages/Authentication/user-profile";

import PrivacyPolicy from "pages/Pages/PrivacyPolicy";
import Kanbanboard from "pages/Tasks/KanbanBoard";
import BlogListView from "pages/Pages/Blogs/ListView";
import BlogGridView from "pages/Pages/Blogs/GridView";
import PageBlogOverview from "pages/Pages/Blogs/Overview";

import FournisseursList from "pages/Ecommerce/EcommerceOrders/FournisseursList";
import CategoriesList from "pages/Ecommerce/EcommerceOrders/CategoriesList";
import ClientsList from "pages/Ecommerce/EcommerceOrders/ClientList";
import BonsCommandeList from "pages/Ecommerce/Achat/BonCommande";
import BonReceptionList from "../pages/Ecommerce/Achat/BonReceptionList";
import BonCommandeClientList from "../pages/Ecommerce/Vente/CommandeClientList";
import VendeursList from "../pages/Ecommerce/EcommerceOrders/VendeursList";
import BonLivraisonList from "../pages/Ecommerce/Vente/BonLivraisonList";
import Devis from "../pages/Ecommerce/Vente/Devis";
import VenteComptoire from "../pages/Ecommerce/Vente/VenteComptoire";
import FactureList from "../pages/Ecommerce/Achat/FactureFournisseur";
import PaymentList from "../pages/Ecommerce/Achat/PaymentList";
import ListFactureClient from "pages/Ecommerce/Vente/FactureClient";
import EncaissementClientList from "pages/Ecommerce/Vente/EncaissementClientList";
import Login from "pages/Authentication/Login";
import Logout from "pages/Authentication/Logout";
import PaiementBcClientList from "pages/Ecommerce/Vente/PaiementBcClientList";
import DepotPage from "pages/Ecommerce/Stock/Depot";
import InventairePage from "pages/Ecommerce/Stock/Inventaire";
//import TransferPage from "pages/Ecommerce/Stock/TransferPage";

const authProtectedRoutes = [
  { path: "/dashboard-analytics", component: <DashboardAnalytics /> },
  { path: "/dashboard-crm", component: <DashboardCrm /> },
  { path: "/dashboard", component: <DashboardEcommerce /> },
  { path: "/index", component: <DashboardEcommerce /> },
  { path: "/dashboard-crypto", component: <DashboardCrypto /> },
  { path: "/dashboard-projects", component: <DashboardProject /> },
  { path: "/dashboard-nft", component: <DashboardNFT /> },
  { path: "/dashboard-job", component: <DashboardJobs /> },

  // apps

  { path: "/apps-ecommerce-products", component: <EcommerceProducts /> },
  {
    path: "/apps-ecommerce-product-details",
    component: <EcommerceProductDetail />,
  },
  { path: "/apps-ecommerce-add-product", component: <EcommerceAddProduct /> },
  { path: "/articlelist", component: <EcommerceOrders /> },
  { path: "/WebSiteSettings", component: <WebSiteSettings /> },

  { path: "/depots", component: <DepotPage /> },
  { path: "/inventaire", component: <InventairePage /> },
  //  { path: "/transfert", component: <TransferPage /> },





  {
    path: "/apps-ecommerce-order-details",
    component: <EcommerceOrderDetail />,
  },
  { path: "/apps-ecommerce-customers", component: <EcommerceCustomers /> },
  { path: "/apps-ecommerce-cart", component: <EcommerceCart /> },
  { path: "/apps-ecommerce-checkout", component: <EcommerceCheckout /> },
  { path: "/apps-ecommerce-sellers", component: <EcommerceSellers /> },
  {
    path: "/apps-ecommerce-seller-details",
    component: <EcommerceSellerDetail />,
  },


  //Chat
  { path: "/Fournisseurs", component: <FournisseursList /> },
  { path: "/boncommande", component: <BonsCommandeList /> },
  { path: "/BonReception", component: <BonReceptionList /> },
  { path: "/FactureList", component: <FactureList /> },
  { path: "/PaymentFournisseur", component: <PaymentList /> },

  { path: "/CommandeClient", component: <BonCommandeClientList /> },
  { path: "/paimentBonCommande", component: <PaiementBcClientList /> },

  { path: "/Devis", component: <Devis /> },
  { path: "/VenteComptoire", component: <VenteComptoire /> },
  { path: "/FactureClient", component: <ListFactureClient /> },

  { path: "/BonLivraison", component: <BonLivraisonList /> },
  { path: "/EncaissementClient", component: <EncaissementClientList /> },

  //EMail
  { path: "/categories", component: <CategoriesList /> },

  //Projects
  { path: "/apps-projects-list", component: <ProjectList /> },
  { path: "/apps-projects-overview", component: <ProjectOverview /> },
  { path: "/apps-projects-create", component: <CreateProject /> },

  //Task
  { path: "/apps-tasks-kanban", component: <Kanbanboard /> },
  { path: "/apps-tasks-list-view", component: <TaskList /> },
  { path: "/apps-tasks-details", component: <TaskDetails /> },

  //Crm

  //Invoices

  //transactions
  { path: "/apps-crypto-transactions", component: <Transactions /> },
  { path: "/Vendeur", component: <VendeursList /> },
  { path: "/client", component: <ClientsList /> },

  { path: "/apps-crypto-buy-sell", component: <BuySell /> },
  { path: "/apps-crypto-orders", component: <CryproOrder /> },
  { path: "/apps-crypto-wallet", component: <MyWallet /> },
  { path: "/apps-crypto-ico", component: <ICOList /> },
  { path: "/apps-crypto-kyc", component: <KYCVerification /> },

  // Base Ui

  //Icons

  //Pages

  { path: "/pages-blog-list", component: <BlogListView /> },
  { path: "/pages-blog-grid", component: <BlogGridView /> },
  { path: "/pages-blog-overview", component: <PageBlogOverview /> },

  //APIkey
  { path: "/apps-api-key", component: <ApiKey /> },

  //User Profile
  { path: "/profile", component: <UserProfile /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
  },
  { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
];

export { authProtectedRoutes, publicRoutes };
