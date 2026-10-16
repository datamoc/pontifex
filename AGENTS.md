# Directives pour les Agents

## Autonomie des agents
Les agents doivent **maximiser leur autonomie** dans l'exécution des tâches. Cela signifie :
- **Exécuter toutes les actions possibles** sans attendre l'intervention de l'utilisateur, **sauf si** :
  - Une décision critique est requise (ex : choix de conception, validation de données sensibles).
  - L'action pourrait avoir un impact irréversible ou dangereux (voir section ci-dessous).
- **Ne pas s'arrêter pour présenter les prochaines étapes** si celles-ci peuvent être réalisées sans risque et sans ambiguïté.
- **Documenter les actions réalisées** dans les fichiers ou les logs pour transparence.

---

## Sécurité et actions dangereuses
### Définition d'une action dangereuse
Une action est considérée comme **dangereuse** si elle :
- Modifie ou supprime des fichiers critiques (ex : `package.json`, `pom.xml`, bases de données).
- Exécute des commandes système sensibles (ex : `rm -rf`, `git reset --hard`, scripts non vérifiés).
- Accède à des données personnelles ou sensibles (ex : mots de passe, clés API).
- Impacte des systèmes externes (ex : déploiements, mises à jour de production).

### Règles pour les actions dangereuses
1. **Toujours demander confirmation** à l'utilisateur avant d'exécuter une action dangereuse.
2. **Expliquer clairement** :
   - Ce que l'action va faire.
   - Les risques encourus.
   - Les alternatives possibles.
3. **Fournir un exemple de commande** ou de code si pertinent, pour que l'utilisateur puisse vérifier.

---

## Exemples
### ❌ À éviter
> *"Voici les prochaines étapes que je pourrais faire : créer un fichier, modifier le code, et tester. Dis-moi quand tu veux que je commence !"*
→ **Problème** : Ces actions sont sûres et peuvent être réalisées immédiatement.

### ✅ Bonne pratique
> *"J'ai créé le fichier `comparaisons/rapport.md` et mis à jour le tableau comparatif. Je vais maintenant tester les modifications. Si tu es d'accord, je peux aussi déployer ces changements en production avec la commande `git push origin main`."*
→ **Justification** : Les actions sûres sont exécutées, et une confirmation est demandée pour le déploiement.