import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Navdata = () => {
    const history = useNavigate();
    //state data
    const [isDashboard, setIsDashboard] = useState<boolean>(false);
    const [isGestion, setIsGestion] = useState<boolean>(false);
    const [isAchat, setIsAchat] = useState<boolean>(false);
    const [isVente, setIsVente] = useState<boolean>(false);
    const [isWebsite, setIsWebsite] = useState<boolean>(false);
    const [isStock, setIsStock] = useState<boolean>(false); // New state for Stock

    const [iscurrentState, setIscurrentState] = useState('Dashboard');

    function updateIconSidebar(e: any) {
        if (e && e.target && e.target.getAttribute("sub-items")) {
            const ul: any = document.getElementById("two-column-menu");
            const iconItems: any = ul.querySelectorAll(".nav-icon.active");
            let activeIconItems = [...iconItems];
            activeIconItems.forEach((item) => {
                item.classList.remove("active");
                var id = item.getAttribute("sub-items");
                const getID = document.getElementById(id) as HTMLElement
                if (getID)
                    getID.classList.remove("show");
            });
        }
    }

    useEffect(() => {
        document.body.classList.remove('twocolumn-panel');
        if (iscurrentState !== 'Dashboard') {
            setIsDashboard(false);
        }
        if (iscurrentState !== 'Gestion') {
            setIsGestion(false);
        }
        if (iscurrentState !== 'Achat') {
            setIsAchat(false);
        }
        if (iscurrentState !== 'Vente') {
            setIsVente(false);
        }
        if (iscurrentState !== 'Website') {
            setIsWebsite(false);
        }
        if (iscurrentState !== 'Stock') { // Reset stock state
            setIsStock(false);
        }
    }, [
        history,
        iscurrentState,
        isDashboard,
        isGestion,
        isAchat,
        isVente,
        isWebsite,
        isStock // Add stock to dependencies
    ]);

    const menuItems: any = [
        {
            label: "Menu",
            isHeader: true,
        },
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "ri-dashboard-2-line",
            link: "/dashboard",
            stateVariables: isDashboard,
            click: function (e: any) {
                e.preventDefault();
                setIsDashboard(!isDashboard);
                setIscurrentState('Dashboard');
                updateIconSidebar(e);
            }
        },
        {
            id: "devis",
            label: "Devis",
            icon: "ri-file-text-line",
            link: "/Devis",
            stateVariables: isDashboard,
        },
        {
            id: "gestion",
            label: "Gestion",
            icon: "ri-apps-2-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsGestion(!isGestion);
                setIscurrentState('Gestion');
                updateIconSidebar(e);
            },
            stateVariables: isGestion,
            subItems: [
                {
                    id: "clients",
                    label: "Clients",
                    link: "/client",
                    parentId: "gestion",
                },
                {
                    id: "fournisseurs",
                    label: "Fournisseurs",
                    link: "/Fournisseurs",
                    parentId: "gestion",
                },
                {
                    id: "categories",
                    label: "Categories",
                    link: "/categories",
                    parentId: "gestion",
                },
                {
                    id: "articles",
                    label: "Articles",
                    link: "/articlelist",
                    parentId: "gestion",
                },
                {
                    id: "vendeurs",
                    label: "Vendeurs",
                    link: "/Vendeur",
                    parentId: "gestion",
                },
            ],
        },
        {
            id: "stock",
            label: "Stock",
            icon: "ri-archive-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsStock(!isStock);
                setIscurrentState('Stock');
                updateIconSidebar(e);
            },
            stateVariables: isStock,
            subItems: [
                {
                    id: "inventaire",
                    label: "Inventaire Physique",
                    icon: "ri-file-list-line",
                    link: "/inventaire",
                    parentId: "stock",
                },
                {
                    id: "depots",
                    label: "Dépôts/Magasins",
                    icon: "ri-store-2-line",
                    link: "/depots",
                    parentId: "stock",
                },
                {
                    id: "mouvements",
                    label: "Mouvements de Stock",
                    icon: "ri-exchange-box-line",
                    link: "/transfert",
                    parentId: "stock",
                },
            ],
        },
        {
            id: "achat",
            label: "Achat",
            icon: "ri-shopping-bag-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsAchat(!isAchat);
                setIscurrentState('Achat');
                updateIconSidebar(e);
            },
            stateVariables: isAchat,
            subItems: [
                {
                    id: "bon-commande",
                    label: "Bon Commande",
                    link: "/BonCommande",
                    parentId: "achat",
                },
                {
                    id: "bon-reception",
                    label: "Bon Reception",
                    link: "/BonReception",
                    parentId: "achat",
                },
                {
                    id: "facture-fournisseur",
                    label: "Facture Fournisseur",
                    link: "/FactureList",
                    parentId: "achat",
                },
                {
                    id: "payment-fournisseur",
                    label: "Payments Fournisseur",
                    link: "/PaymentFournisseur",
                    parentId: "achat",
                },
            ],
        },
        {
            id: "vente",
            label: "Vente",
            icon: "ri-money-dollar-circle-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsVente(!isVente);
                setIscurrentState('Vente');
                updateIconSidebar(e);
            },
            stateVariables: isVente,
            subItems: [
                {
                    id: "ventecomptoire",
                    label: "Vente Comptoire",
                    icon: "ri-shopping-cart-line",
                    link: "/VenteComptoire",
                    parentId: "vente",
                },
                {
                    id: "commande-client",
                    label: "Commande Client",
                    link: "/CommandeClient",
                    parentId: "vente",
                },
                {
                    id: "paimentBonCommande",
                    label: "Paiment Commande Client",
                    link: "/paimentBonCommande",
                    parentId: "vente",
                },
                {
                    id: "bon-livraison",
                    label: "Bon Livraison",
                    link: "/BonLivraison",
                    parentId: "vente"
                },
                {
                    id: "facture-client",
                    label: "Facture Client",
                    link: "/FactureClient",
                    parentId: "vente"
                },
                {
                    id: "encaissement-client",
                    label: "Encaissement Client",
                    link: "/EncaissementClient",
                    parentId: "vente"
                },
            ],
        },
        {
            id: "website",
            label: "Site Web",
            icon: "ri-global-line",
            link: "/#",
            click: function (e: any) {
                e.preventDefault();
                setIsWebsite(!isWebsite);
                setIscurrentState('Website');
                updateIconSidebar(e);
            },
            stateVariables: isWebsite,
            subItems: [
                {
                    id: "website-parametres",
                    label: "Paramètres Site Web",
                    link: "/website-settings",
                    parentId: "website",
                },
                {
                    id: "website-categories",
                    label: "Gestion Catégories",
                    link: "/website-categories",
                    parentId: "website",
                },
                {
                    id: "website-articles",
                    label: "Gestion Articles",
                    link: "/WebSiteSettings",
                    parentId: "website",
                },
                {
                    id: "website-carousel",
                    label: "Gestion Carousel",
                    link: "/website-carousel",
                    parentId: "website",
                },
            ],
        },
  
    
    ];
    return <React.Fragment>{menuItems}</React.Fragment>;
};
export default Navdata;