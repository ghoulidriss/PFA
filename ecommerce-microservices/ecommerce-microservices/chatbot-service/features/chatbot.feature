Feature: Chatbot E-Commerce IA
  En tant qu'utilisateur connecté à la plateforme e-commerce
  Je veux poser des questions en langage naturel au chatbot
  Afin d'obtenir des informations sur les produits et les commandes

  Scenario: Vérification de disponibilité d'un produit par ID
    Given un utilisateur connecté à la plateforme e-commerce
    When il demande "Est-ce que le produit id 5 est disponible ?"
    Then le chatbot retourne une réponse sur la disponibilité du produit

  Scenario: Recherche de produits par catégorie
    Given un utilisateur connecté à la plateforme e-commerce
    When il demande "Je cherche des produits dans la catégorie Électronique"
    Then le chatbot retourne une liste de produits disponibles

  Scenario: Statistiques du catalogue
    Given un utilisateur connecté à la plateforme e-commerce
    When il demande "Combien de produits sont en stock en ce moment ?"
    Then le chatbot retourne les statistiques actuelles du stock

  Scenario: Recommandation intelligente
    Given un utilisateur connecté à la plateforme e-commerce
    When il demande "Qu'est-ce que tu me recommandes comme laptop ?"
    Then le chatbot retourne des recommandations de produits

  Scenario: Recherche par budget
    Given un utilisateur connecté à la plateforme e-commerce
    When il demande "Montre-moi des produits à moins de 500 DT"
    Then le chatbot retourne des produits dans ce budget

  Scenario: Question ambiguë
    Given un utilisateur connecté à la plateforme e-commerce
    When il pose une question ambiguë "quelque chose"
    Then le chatbot retourne une réponse utile ou demande de précision
