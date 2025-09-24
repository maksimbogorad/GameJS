function Game() 
{
    this.mapWidth = 40;
    this.mapHeight = 24;
    this.tileSize = 25;
    this.map = [];
    this.hero = null;
    this.enemies = [];
    this.items = [];
    this.heroAttackPower = 10;
    this.heroMaxHealth = 100;
    this.heroHealth = 100;
    this.potionsCollected = 0;
    this.swordsCollected = 0;
    this.enemiesKilled = 0;
    this.rooms = [];
}

Game.prototype.getRandomInt = function(min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

Game.prototype.isValidPosition = function(x, y) 
{
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
};

Game.prototype.init = function() 
{
    this.generateConnectedMap();
    this.renderMap();
    this.setupControls();
    this.startGameLoop();
    this.updateStats();
};

Game.prototype.generateConnectedMap = function() 
{
    this.fillMapWithWalls();
    this.generateConnectedRooms();
    this.placeGameObjects();
};

Game.prototype.fillMapWithWalls = function() 
{
    for (var y = 0; y < this.mapHeight; y++) 
    {
        this.map[y] = [];
        for (var x = 0; x < this.mapWidth; x++) 
        {
            this.map[y][x] = 'W';
        }
    }
};

Game.prototype.generateConnectedRooms = function() 
{
    this.createMainPassages();
    this.createRoomsAlongPassages();
    this.ensureConnectivity();
};

Game.prototype.createMainPassages = function() 
{
    
    var horizontalCount = this.getRandomInt(3, 5);
    var verticalCount = this.getRandomInt(3, 5);
    
    
    for (var h = 0; h < horizontalCount; h++) 
    {
        var y = Math.floor(this.mapHeight * (h + 1) / (horizontalCount + 1));
        this.createHorizontalPassage(y);
    }
    
    
    for (var v = 0; v < verticalCount; v++) 
    {
        var x = Math.floor(this.mapWidth * (v + 1) / (verticalCount + 1));
        this.createVerticalPassage(x);
    }
};

Game.prototype.createHorizontalPassage = function(y) 
{
    for (var x = 0; x < this.mapWidth; x++) {
        if (this.isValidPosition(x, y)) {
            this.map[y][x] = '.';
        }
    }
};

Game.prototype.createVerticalPassage = function(x) 
{
    for (var y = 0; y < this.mapHeight; y++) {
        if (this.isValidPosition(x, y)) {
            this.map[y][x] = '.';
        }
    }
};

Game.prototype.createRoomsAlongPassages = function() 
{
    var roomCount = this.getRandomInt(5, 10);
    
    for (var i = 0; i < roomCount; i++) 
        this.createRoomNearPassage();
};

Game.prototype.createRoomNearPassage = function() 
{
    var maxAttempts = 50;
    
    for (var attempt = 0; attempt < maxAttempts; attempt++) 
    {
        var roomWidth = this.getRandomInt(3, 8);
        var roomHeight = this.getRandomInt(3, 8);
        var roomX = this.getRandomInt(1, this.mapWidth - roomWidth - 1);
        var roomY = this.getRandomInt(1, this.mapHeight - roomHeight - 1);
        
        if (this.isValidPosition(roomX, roomY) && this.isValidPosition(roomX + roomWidth - 1, roomY + roomHeight - 1)) 
        {
            
            
            if (this.isRoomConnectedToPassage(roomX, roomY, roomWidth, roomHeight)) 
            {
                this.createRoom(roomX, roomY, roomWidth, roomHeight);
                return;
            }
        }
    }
};

Game.prototype.isRoomConnectedToPassage = function(x, y, width, height) 
{
    
    for (var i = x - 1; i <= x + width; i++) 
    {
        if (this.isValidPosition(i, y - 1) && this.map[y - 1][i] === '.') return true;
        if (this.isValidPosition(i, y + height) && this.map[y + height][i] === '.') return true;
    }
    
    for (var j = y - 1; j <= y + height; j++)
     {
        if (this.isValidPosition(x - 1, j) && this.map[j][x - 1] === '.') return true;
        if (this.isValidPosition(x + width, j) && this.map[j][x + width] === '.') return true;
    }
    
    return false;
};

Game.prototype.createRoom = function(x, y, width, height) 
{
    var room = { x: x, y: y, width: width, height: height };
    this.rooms.push(room);
    
    for (var ry = y; ry < y + height && ry < this.mapHeight; ry++) 
    {
        for (var rx = x; rx < x + width && rx < this.mapWidth; rx++) 
        {
            if (this.isValidPosition(rx, ry))
             {
                this.map[ry][rx] = '.';

            }
        }
    }
};

Game.prototype.ensureConnectivity = function() 
{
    this.addRandomConnections(5);
};

Game.prototype.addRandomConnections = function(count) 
{
    for (var i = 0; i < count; i++)
     {
        var x = this.getRandomInt(1, this.mapWidth - 2);
        var y = this.getRandomInt(1, this.mapHeight - 2);
        
        
        var length = this.getRandomInt(2, 5);
        var horizontal = Math.random() > 0.5;
        
        for (var j = 0; j < length; j++) 
        {
            if (horizontal) {
                var newX = x + j;
                if (this.isValidPosition(newX, y)) this.map[y][newX] = '.';
            } else {
                var newY = y + j;
                if (this.isValidPosition(x, newY)) this.map[newY][x] = '.';
            }
        }
    }
};

Game.prototype.placeGameObjects = function() 
{
    this.placeItems('SW', 2);
    this.placeItems('HP', 10);
    this.placeHero();
    this.placeEnemies(10);
};

Game.prototype.placeItems = function(itemType, count) 
{
    var placed = 0;
    var attempts = 0;
    var maxAttempts = 1000;
    
    while (placed < count && attempts < maxAttempts) {
        var x = this.getRandomInt(0, this.mapWidth - 1);
        var y = this.getRandomInt(0, this.mapHeight - 1);
        
        if (this.map[y][x] === '.' && !this.getItemAt(x, y)) 
        {
            this.map[y][x] = itemType;
            this.items.push({x: x, y: y, type: itemType});
            placed++;
        }
        attempts++;
    }
};

Game.prototype.placeHero = function() 
{
    
    for (var attempts = 0; attempts < 100; attempts++) {
        var x = this.getRandomInt(0, this.mapWidth - 1);
        var y = this.getRandomInt(0, this.mapHeight - 1);
        
        if (this.map[y][x] === '.') {
            this.hero = { x: x, y: y };
            return;
        }
    }
    
    
    for (var y = 0; y < this.mapHeight; y++) 
    {
        for (var x = 0; x < this.mapWidth; x++) {
            if (this.map[y][x] === '.') {
                this.hero = { x: x, y: y };
                return;
            }
        }
    }
};

Game.prototype.placeEnemies = function(count) 
{
    var placed = 0;
    var attempts = 0;
    var maxAttempts = 1000;
    
    while (placed < count && attempts < maxAttempts) {
        var x = this.getRandomInt(0, this.mapWidth - 1);
        var y = this.getRandomInt(0, this.mapHeight - 1);
        
        if (this.map[y][x] === '.' && 
            !this.getEnemyAt(x, y) && 
            !(this.hero && this.hero.x === x && this.hero.y === y)) 
        {
            
            this.enemies.push({
                x: x, 
                y: y, 
                health: 30,
                maxHealth: 30,
                attackPower: 5
            });
            placed++;
        }
        attempts++;
    }
};

Game.prototype.renderMap = function() 
{
    var $field = $('.field');

    $field.empty();
    $field.width(this.mapWidth * this.tileSize);
    $field.height(this.mapHeight * this.tileSize);
    
    for (var y = 0; y < this.mapHeight; y++)
     {
        for (var x = 0; x < this.mapWidth; x++) 
        {
            var tileType = this.map[y][x];

            var $tile = $('<div class="tile"></div>');
            
            
            var tileClass = 'tile';
            
            
            if (tileType === 'W') 
                tileClass = 'tileW';
             else if (tileType === 'HP') 
                tileClass = 'tileHP';
                else if (tileType === 'SW') 
                tileClass = 'tileSW';
            
            $tile.addClass(tileClass);
            $tile.css({
                left: x * this.tileSize + 'px',
                top: y * this.tileSize + 'px'
            });
            
            
            var hasHero = this.hero && this.hero.x === x && this.hero.y === y;
            var enemy = this.getEnemyAt(x, y);
            
            if (hasHero) 
            {
                
                $tile.removeClass().addClass('tile tileP');
                var heroHealthPercent = (this.heroHealth / this.heroMaxHealth) * 100;
                var $heroHealth = $('<div class="health"></div>');
                $heroHealth.css('width', heroHealthPercent + '%');
                $tile.append($heroHealth);
            } 
            else if (enemy) 
            {
                
                $tile.removeClass().addClass('tile tileE');
                var healthPercent = (enemy.health / enemy.maxHealth) * 100;
                var $health = $('<div class="health"></div>');
                $health.css('width', healthPercent + '%');
                $tile.append($health);
            }
            
            $field.append($tile);
        }
    }

};

Game.prototype.getEnemyAt = function(x, y) 
{
    for (var i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].x === x && this.enemies[i].y === y) {
            return this.enemies[i];
        }
    }
    return null;
};

Game.prototype.getItemAt = function(x, y) 
{
    for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].x === x && this.items[i].y === y) {
            return this.items[i];
        }
    }
    return null;
};

Game.prototype.setupControls = function() 
{
    var self = this;
    $(document).keydown(function(e) {
        if (e.keyCode === 32) { 
            e.preventDefault(); 
        }
        
        var newX = self.hero.x;
        var newY = self.hero.y;
        
        switch(e.keyCode) {
            case 87: 
                newY--;
                break;
            case 65: 
                newX--;
                break;
            case 83: 
                newY++;
                break;
            case 68: 
                newX++;
                break;
            case 32: 
                self.attackEnemies();
                return;
            default:
                return;
        }
        
        if (self.canMoveTo(newX, newY)) {
            self.moveHero(newX, newY);
        }
    });
};

Game.prototype.canMoveTo = function(x, y) 
{
    if (!this.isValidPosition(x, y)) {
        return false;
    }
    return this.map[y][x] !== 'W';
};

Game.prototype.moveHero = function(newX, newY)
 {
    this.hero.x = newX;
    this.hero.y = newY;
    
    
    var item = this.getItemAt(newX, newY);
    if (item) {
        this.collectItem(item);
    }
    
    this.renderMap();
    this.updateStats();
};

Game.prototype.collectItem = function(item)
 {
    
    for (var i = 0; i < this.items.length; i++) 
    {
        if (this.items[i] === item)
         {
            this.items.splice(i, 1);
            break;
        }
    }
    this.map[item.y][item.x] = '.';
    
    
    if (item.type === 'HP') 
    {
        this.heroHealth = Math.min(this.heroHealth + 20, this.heroMaxHealth);
        this.potionsCollected++;
    } 
    else if (item.type === 'SW') 
    {

        this.heroAttackPower += 5;
        this.swordsCollected++;
    }
    
    this.updateStats();
};

Game.prototype.attackEnemies = function() 
{
    var attacked = false;

    for (var i = this.enemies.length - 1; i >= 0; i--) 
    {
        var enemy = this.enemies[i];
        var dx = Math.abs(enemy.x - this.hero.x);
        var dy = Math.abs(enemy.y - this.hero.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1)) 
        {
            enemy.health -= this.heroAttackPower;
            attacked = true;
            
            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
                this.enemiesKilled++;
            }
        }
    }
    
    if (attacked) 
    {
        this.renderMap();
        this.updateStats();
    }
};

Game.prototype.moveEnemies = function() 
{
    for (var i = 0; i < this.enemies.length; i++) 
    {
        var enemy = this.enemies[i];
        var directions = [
            {dx: 0, dy: -1}, 
            {dx: 1, dy: 0},  
            {dx: 0, dy: 1},  
            {dx: -1, dy: 0}  
        ];
        
        
        var moveDirection;
        if (Math.random() < 0.7) 
        {
            
            var dx = this.hero.x - enemy.x;
            var dy = this.hero.y - enemy.y;
            
            if (Math.abs(dx) > Math.abs(dy)) 
                moveDirection = dx > 0 ? directions[1] : directions[3];
            else 
                moveDirection = dy > 0 ? directions[2] : directions[0];
        } 
        else 
            moveDirection = directions[this.getRandomInt(0, 3)];
        
        var newX = enemy.x + moveDirection.dx;
        var newY = enemy.y + moveDirection.dy;
        
        if (this.canMoveTo(newX, newY) && !this.getEnemyAt(newX, newY) &&  !(newX === this.hero.x && newY === this.hero.y)) 
        {
            enemy.x = newX;
            enemy.y = newY;
        }
    }
};

Game.prototype.enemiesAttack = function() 
{
    for (var i = 0; i < this.enemies.length; i++)
     {
        var enemy = this.enemies[i];
        var dx = Math.abs(enemy.x - this.hero.x);
        var dy = Math.abs(enemy.y - this.hero.y);
        
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1)) 
        {
            this.heroHealth -= enemy.attackPower;
            if (this.heroHealth <= 0) {
                alert('Игра окончена! Вы убили ' + this.enemiesKilled + ' врагов.');
                location.reload();
            }
        }
    }
};

Game.prototype.startGameLoop = function() 
{
    var self = this;
    setInterval(function() {
        self.moveEnemies();
        self.enemiesAttack();
        self.renderMap();
        self.updateStats();
    }, 1000);
};

Game.prototype.updateStats = function() 
{
    $('#hero-health').text(this.heroHealth);
    $('#hero-attack').text(this.heroAttackPower);
    $('#potions-collected').text(this.potionsCollected);
    $('#swords-collected').text(this.swordsCollected);
    $('#enemies-killed').text(this.enemiesKilled);
};