interface LevelDef {
    // Définition minimale pour éviter les erreurs
    [key: string]: any;
}

class Physics {
    level: LevelDef;

    constructor(def: LevelDef) {
        this.level = def;
        this.setupLevel();
        this.setupVehicle();
        this.setupEvents();
    }

    setupLevel() {
        // Logique de setup du niveau
    }

    setupVehicle() {
        // Logique de setup du véhicule
    }

    setupEvents() {
        // Logique de setup des événements
    }
}

export default Physics;