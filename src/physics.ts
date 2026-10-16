  constructor(def: LevelDef) {
    this.level = def;
    this.setupLevel();
    this.setupVehicle();
    this.setupEvents();
  }