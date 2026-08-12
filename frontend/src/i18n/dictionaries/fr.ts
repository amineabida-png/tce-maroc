// Dictionnaire français. Pour ajouter l'arabe plus tard : créer ar.ts avec
// la même forme, l'enregistrer dans i18n/index.ts, puis brancher un
// sélecteur de langue (RTL à gérer au niveau layout à ce moment-là).
export const fr = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement…',
    search: 'Rechercher',
    currency: 'DH',
  },
  auth: {
    title: 'Connexion',
    subtitle: 'ERP TCE Maroc',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    logout: 'Déconnexion',
  },
  nav: {
    dashboard: 'Tableau de bord',
    chantiers: 'Chantiers',
    ouvrages: 'Bibliothèque de prix',
    devis: 'Devis',
    commandes: 'Bons de commande',
    factures: 'Factures',
    clients: 'Clients',
    fournisseurs: 'Fournisseurs',
    sousTraitants: 'Sous-traitants',
    achats: 'Commandes fournisseurs',
    articles: 'Articles',
    stock: 'Mouvements de stock',
    rh: 'Ressources humaines',
    finances: 'Finances',
    documents: 'Documents',
    reporting: 'Reporting',
    administration: 'Administration',
    parametres: 'Paramètres société',
  },
  dashboard: {
    welcome: 'Bienvenue',
    placeholder: 'Le tableau de bord (KPI, graphiques) arrive dans un prochain module.',
  },
} as const;

export type Dictionary = typeof fr;
