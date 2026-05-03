import React, { useEffect, useState } from 'react';
import { 
  Col, 
  Dropdown, 
  DropdownMenu, 
  DropdownToggle, 
  Nav, 
  NavItem, 
  NavLink, 
  Row, 
  TabContent, 
  TabPane,
  Badge
} from 'reactstrap';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import SimpleBar from "simplebar-react";

import moment from 'moment';

import { fetchBonsCommandeClient } from 'Components/CommandeClient/CommandeClientServices';
import { FetchBonLivraison } from 'Components/CommandeClient/BonLivraisonServices';

const NotificationDropdown = () => {
  // State pour le dropdown
  const [isNotificationDropdown, setIsNotificationDropdown] = useState<boolean>(false);
  
  // State pour le tab actif
  const [activeTab, setActiveTab] = useState<string>('1');
  
  // État pour les notifications réelles
  const [notificationsData, setNotificationsData] = useState<any[]>([]);
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set());

  // État pour le nombre de notifications
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Charger les notifications
  useEffect(() => {
    // Disabled as requested: getallboncommandeclient and getbonliv are not needed
    /*
    const loadNotifications = async () => {
      try {
        const [bonsCommande, bonsLivraison] = await Promise.all([
          fetchBonsCommandeClient(),
          FetchBonLivraison()
        ]);
        // ... rest of the logic
      } catch (error) {
        console.error("Erreur lors du chargement des notifications:", error);
      }
    };
    loadNotifications();
    */
  }, []);

  // Marquer comme lu lors de l'ouverture
  useEffect(() => {
    if (isNotificationDropdown && unreadIds.size > 0) {
      const readIdsJson = localStorage.getItem('read-notifications');
      const readIds = readIdsJson ? JSON.parse(readIdsJson) : [];
      const newReadIds = Array.from(new Set([...readIds, ...Array.from(unreadIds)]));
      
      localStorage.setItem('read-notifications', JSON.stringify(newReadIds));
      setUnreadIds(new Set());
      setNotificationCount(0);
    }
  }, [isNotificationDropdown, unreadIds]);

  const notifications = {
    all: notificationsData,
    alerts: notificationsData.filter(n => n.color === 'primary' || n.color === 'success'),
    orders: []
  };

  // Fonction pour toggle le dropdown
  const toggleNotificationDropdown = () => {
    setIsNotificationDropdown(!isNotificationDropdown);
  };

  // Fonction pour changer de tab
  const toggleTab = (tab: string) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotificationCount(0);
  };

  return (
    <React.Fragment>
      <Dropdown 
        isOpen={isNotificationDropdown} 
        toggle={toggleNotificationDropdown} 
        className="topbar-head-dropdown ms-1 header-item"
      >
        <DropdownToggle 
          type="button" 
          tag="button" 
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle position-relative"
        >
          <i className='bx bx-bell fs-22'></i>
          {notificationCount > 0 && (
            <Badge 
              color="danger" 
              className="position-absolute top-0 end-0 translate-middle badge rounded-pill"
              style={{ fontSize: '10px', padding: '4px 6px' }}
            >
              {notificationCount}
              <span className="visually-hidden">notifications non lues</span>
            </Badge>
          )}
        </DropdownToggle>
        
        <DropdownMenu className="dropdown-menu-lg dropdown-menu-end p-0" style={{ width: '360px' }}>
          <div className="p-3 border-bottom">
            <Row className="align-items-center">
              <Col>
                <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
              </Col>
              <Col className="col-auto">
                {notificationCount > 0 && (
                  <Link 
                    to="#" 
                    className="text-muted text-decoration-underline" 
                    onClick={markAllAsRead}
                  >
                    Marquer tout comme lu
                  </Link>
                )}
              </Col>
            </Row>
          </div>

          {/* Tabs Navigation */}
          <Nav tabs className="nav-tabs-custom border-bottom">
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '1' })}
                onClick={() => toggleTab('1')}
              >
                Toutes
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '2' })}
                onClick={() => toggleTab('2')}
              >
                Alertes
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === '3' })}
                onClick={() => toggleTab('3')}
              >
                Commandes
              </NavLink>
            </NavItem>
          </Nav>

          {/* Tabs Content */}
          <TabContent activeTab={activeTab}>
            {/* Tab 1: Toutes les notifications */}
            <TabPane tabId="1">
              <SimpleBar style={{ maxHeight: '300px' }}>
                {notifications.all.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="avatar-md mx-auto mb-4">
                      <div className="avatar-title bg-light text-secondary rounded-circle fs-24">
                        <i className="bx bx-bell-off"></i>
                      </div>
                    </div>
                    <h5 className="fs-16 text-muted">Aucune notification pour l'instant !</h5>
                    <p className="text-muted mb-0">
                      Vous serez notifié lorsqu'il y aura de nouvelles activités.
                    </p>
                  </div>
                ) : (
                  notifications.all.map((item, key) => (
                    <div className="text-reset notification-item d-block dropdown-item position-relative" key={key}>
                      <div className="d-flex">
                        <div className="avatar-xs me-3 flex-shrink-0">
                          <span className={`avatar-title bg-soft-${item.color} text-${item.color} rounded-circle fs-16`}>
                            <i className={`bx ${item.icon}`}></i>
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <Link to={item.link} className="stretched-link" onClick={() => setIsNotificationDropdown(false)}>
                            <h6 className="mt-0 mb-2 lh-base">{item.title}</h6>
                          </Link>
                          <p className="mb-0 fs-11 fw-medium text-uppercase text-muted">
                            <span><i className="mdi mdi-clock-outline"></i> {item.time}</span>
                          </p>
                          <p className="text-muted mb-0">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </SimpleBar>
            </TabPane>

            {/* Tab 2: Alertes */}
            <TabPane tabId="2">
              <SimpleBar style={{ maxHeight: '300px' }}>
                {notifications.alerts.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="avatar-md mx-auto mb-4">
                      <div className="avatar-title bg-light text-warning rounded-circle fs-24">
                        <i className="bx bx-alarm-exclamation"></i>
                      </div>
                    </div>
                    <h5 className="fs-16 text-muted">Aucune alerte</h5>
                    <p className="text-muted mb-0">
                      Pas d'alertes pour le moment.
                    </p>
                  </div>
                ) : (
                  notifications.alerts.map((item, key) => (
                    <div className="text-reset notification-item d-block dropdown-item position-relative" key={key}>
                      <div className="d-flex">
                        <div className="avatar-xs me-3 flex-shrink-0">
                          <span className={`avatar-title bg-soft-${item.color} text-${item.color} rounded-circle fs-16`}>
                            <i className={`bx ${item.icon}`}></i>
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <Link to={item.link} className="stretched-link" onClick={() => setIsNotificationDropdown(false)}>
                            <h6 className="mt-0 mb-2 lh-base">{item.title}</h6>
                          </Link>
                          <p className="text-muted mb-0">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </SimpleBar>
            </TabPane>

            {/* Tab 3: Commandes */}
            <TabPane tabId="3">
              <SimpleBar style={{ maxHeight: '300px' }}>
                {notifications.orders.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="avatar-md mx-auto mb-4">
                      <div className="avatar-title bg-light text-primary rounded-circle fs-24">
                        <i className="bx bx-package"></i>
                      </div>
                    </div>
                    <h5 className="fs-16 text-muted">Aucune notification de commande</h5>
                    <p className="text-muted mb-0">
                      Aucune mise à jour de commande récente.
                    </p>
                  </div>
                ) : (
                  <div></div>
                )}
              </SimpleBar>
            </TabPane>
          </TabContent>

          {/* Footer avec lien pour voir toutes les notifications */}
          <div className="p-3 border-top">
            <div className="d-grid">
              <Link 
                to="/notifications" 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setIsNotificationDropdown(false)}
              >
                <i className="bx bx-list-ul me-1"></i> Voir toutes les notifications
              </Link>
            </div>
          </div>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  );
};

export default NotificationDropdown;