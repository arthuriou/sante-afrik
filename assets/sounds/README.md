# 🔊 Sons de notification

Ce dossier contient les fichiers audio utilisés pour les notifications de l'application.

## 📁 Structure recommandée

```
assets/sounds/
├── notification.mp3    # Son par défaut
├── message.mp3         # Son pour les messages
├── appointment.mp3     # Son pour les rendez-vous
├── reminder.mp3        # Son pour les rappels
└── emergency.mp3       # Son pour les urgences
```

## 🎵 Formats supportés

- **MP3** : Format recommandé (bonne compression)
- **WAV** : Qualité maximale (fichiers plus lourds)
- **AAC** : Format iOS natif

## ⚙️ Configuration

Les sons sont configurés dans les préférences de notification de l'utilisateur via l'API :
- Chemin : `/sounds/nom-du-fichier.mp3`
- Volume : 0.0 à 1.0 (0% à 100%)

## 📱 Utilisation

Les sons sont automatiquement joués selon les préférences de l'utilisateur :
- **soundenabled** : true/false
- **soundfile** : chemin vers le fichier
- **volume** : niveau de volume

## 🔧 Ajout de nouveaux sons

1. Ajoutez le fichier audio dans ce dossier
2. Mettez à jour la liste `availableSounds` dans les écrans de préférences
3. Testez la notification avec le bouton "Tester la notification"
