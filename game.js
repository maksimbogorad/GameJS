function Game() {
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
    this.seed = Date.now() + Math.random();
}


Game.prototype.getRandomInt = function(min, max) 
{
    this.seed = (this.seed * 9301 + 49297) % 233280;
    var rnd = this.seed / 233280;
    return Math.floor(rnd * (max - min + 1)) + min;
};

Game.prototype.isValidPosition = function(x, y) 
{
    return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
};

Game.prototype.init = function() 
{
    this.generateFullyConnectedMap();
    this.renderMap();
    this.setupControls();
    this.startGameLoop();
    this.updateStats();
};

Game.prototype.generateFullyConnectedMap = function() 
{
    this.fillMapWithWalls();
    this.createMainPath();
    this.addConnectedRooms();
    this.placeGameObjects();
};

Game.prototype.fillMapWithWalls = function() 
{
    for (var y = 0; y < this.mapHeight; y++) 
    {
        this.map[y] = [];
        for (var x = 0; x < this.mapWidth; x++) 
            this.map[y][x] = 'W';
    }
};

Game.prototype.createMainPath = function() 
{
    
    var horizontalPassages = this.getRandomInt(3, 5);
    var verticalPassages = this.getRandomInt(3, 5);
    
    
    var usedY = [];
    for (var h = 0; h < horizontalPassages; h++) {
        var y;
        do {
            y = this.getRandomInt(3, this.mapHeight - 4);
        } while (usedY.some(used => Math.abs(used - y) < 3));
        
        usedY.push(y);
        this.createPassage(0, y, this.mapWidth - 1, y, 'horizontal');
    }
    
    
    var usedX = [];
    for (var v = 0; v < verticalPassages; v++) 
    {
        var x;
        do {
            x = this.getRandomInt(3, this.mapWidth - 4);
        } while (usedX.some(used => Math.abs(used - x) < 3));
        
        usedX.push(x);
        this.createPassage(x, 0, x, this.mapHeight - 1, 'vertical');
    }
    
    
    this.ensureIntersectionConnections(usedX, usedY);
};

Game.prototype.createPassage = function(startX, startY, endX, endY, direction) 
{
    if (direction === 'horizontal') 
    {
        for (var x = startX; x <= endX; x++) {
            if (this.isValidPosition(x, startY)) {
                this.map[startY][x] = '.';
            }
        }
    } else {
        for (var y = startY; y <= endY; y++) 
        {
            if (this.isValidPosition(startX, y)) {
                this.map[y][startX] = '.';
            }
        }
    }
};

Game.prototype.ensureIntersectionConnections = function(verticalX, horizontalY) 
{
    
    for (var i = 0; i < verticalX.length; i++) 
    {
        for (var j = 0; j < horizontalY.length; j++) 
        {
            var x = verticalX[i];
            var y = horizontalY[j];
            
            for (var dx = -1; dx <= 1; dx++) 
            {
                for (var dy = -1; dy <= 1; dy++) 
                {
                    var nx = x + dx;
                    var ny = y + dy;
                    if (this.isValidPosition(nx, ny)) 
                        this.map[ny][nx] = '.';
                }
            }
        }
    }
};

Game.prototype.addConnectedRooms = function() 
{
    var roomCount = this.getRandomInt(5, 10);
    
    for (var i = 0; i < roomCount; i++) 
        this.createGuaranteedConnectedRoom();
};

Game.prototype.createGuaranteedConnectedRoom = function() 
{
    var maxAttempts = 100;
    
    for (var attempt = 0; attempt < maxAttempts; attempt++)
     {
        var roomWidth = this.getRandomInt(3, 8);
        var roomHeight = this.getRandomInt(3, 8);
        
        
        var potentialPositions = this.findRoomPositionsNearPassages(roomWidth, roomHeight);
        
        if (potentialPositions.length > 0) 
        {
            var position = potentialPositions[this.getRandomInt(0, potentialPositions.length - 1)];
            this.createRoom(position.x, position.y, roomWidth, roomHeight);
            this.createGuaranteedRoomConnection(position.x, position.y, roomWidth, roomHeight);
            return;
        }
    }
};

Game.prototype.findRoomPositionsNearPassages = function(roomWidth, roomHeight) 
{
    var positions = [];
    
    
    for (var y = 1; y < this.mapHeight - roomHeight - 1; y++)
     {
        for (var x = 1; x < this.mapWidth - roomWidth - 1; x++)
         {
            if (this.canPlaceRoom(x, y, roomWidth, roomHeight) && 
                this.roomTouchesPassage(x, y, roomWidth, roomHeight))
                positions.push({x: x, y: y});
        }
    }
    
    return positions;
};

Game.prototype.canPlaceRoom = function(x, y, width, height)
{
    for (var ry = y - 1; ry < y + height + 1; ry++) 
    {
        for (var rx = x - 1; rx < x + width + 1; rx++) 
        {
            if (!this.isValidPosition(rx, ry)) return false;
            if (rx >= x && rx < x + width && ry >= y && ry < y + height) 
            {
                if (this.map[ry][rx] === '.') 
                    return false; 
            }
        }
    }
    return true;
};

Game.prototype.roomTouchesPassage = function(x, y, width, height) 
{
    for (var i = x; i < x + width; i++) 
    {
        if (y > 0 && this.map[y - 1][i] === '.') return true;
        if (y + height < this.mapHeight && this.map[y + height][i] === '.') return true;
    }
    
    for (var j = y; j < y + height; j++) 
    {
        if (x > 0 && this.map[j][x - 1] === '.') return true;
        if (x + width < this.mapWidth && this.map[j][x + width] === '.') return true;
    }
    
    return false;
};

Game.prototype.createRoom = function(x, y, width, height) 
{
    var room = { x: x, y: y, width: width, height: height };
    this.rooms.push(room);
    
    for (var ry = y; ry < y + height; ry++) 
    {
        for (var rx = x; rx < x + width; rx++) 
        {
            if (this.isValidPosition(rx, ry)) 
            {
                this.map[ry][rx] = '.';
            }
        }
    }
};

Game.prototype.createGuaranteedRoomConnection = function(x, y, width, height) 
{
    var connectionPoints = [];
    
    for (var i = x; i < x + width; i++) 
    {
        if (y > 0 && this.map[y - 1][i] === '.') 
            connectionPoints.push({x: i, y: y, dir: 'up'});
        if (y + height < this.mapHeight && this.map[y + height][i] === '.') 
            connectionPoints.push({x: i, y: y + height - 1, dir: 'down'});
    }
    
    for (var j = y; j < y + height; j++) 
    {
        if (x > 0 && this.map[j][x - 1] === '.') {
            connectionPoints.push({x: x, y: j, dir: 'left'});
        }
        if (x + width < this.mapWidth && this.map[j][x + width] === '.') {
            connectionPoints.push({x: x + width - 1, y: j, dir: 'right'});
        }
    }
    
    if (connectionPoints.length > 0) 
    {
        var connections = Math.min(this.getRandomInt(1, 2), connectionPoints.length);
        for (var c = 0; c < connections; c++) 
        {
            var point = connectionPoints[this.getRandomInt(0, connectionPoints.length - 1)];
            connectionPoints = connectionPoints.filter(p => p !== point);
            
            if (point.dir === 'up') 
                this.map[point.y - 1][point.x] = '.';
            else if (point.dir === 'down') 
                this.map[point.y + 1][point.x] = '.';
            else if (point.dir === 'left') 
                this.map[point.y][point.x - 1] = '.';
            else if (point.dir === 'right') 
                this.map[point.y][point.x + 1] = '.';
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
    var floorTiles = this.getFloorTiles();
    
    this.shuffleArray(floorTiles);
    
    for (var i = 0; i < floorTiles.length && placed < count; i++) 
    {
        var tile = floorTiles[i];
        if (!this.getItemAt(tile.x, tile.y) && 
            !this.getEnemyAt(tile.x, tile.y) &&
            !(this.hero && this.hero.x === tile.x && this.hero.y === tile.y)) 
        { 
            this.map[tile.y][tile.x] = itemType;
            this.items.push({x: tile.x, y: tile.y, type: itemType});
            placed++;
        }
    }
};

Game.prototype.getFloorTiles = function() 
{
    var tiles = [];
    for (var y = 0; y < this.mapHeight; y++)
     {
        for (var x = 0; x < this.mapWidth; x++) 
        {
            if (this.map[y][x] === '.') 
                tiles.push({x: x, y: y});
        }
    }
    return tiles;
};

Game.prototype.shuffleArray = function(array) 
{
    for (var i = array.length - 1; i > 0; i--) 
    {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

Game.prototype.placeHero = function() 
{
    var floorTiles = this.getFloorTiles();
    if (floorTiles.length > 0) 
    {
        var randomTile = floorTiles[this.getRandomInt(0, floorTiles.length - 1)];
        this.hero = { x: randomTile.x, y: randomTile.y };
    }
};

Game.prototype.placeEnemies = function(count) 
{
    var floorTiles = this.getFloorTiles();
    var availableTiles = floorTiles.filter(tile => 
        !(tile.x === this.hero.x && tile.y === this.hero.y)
    );
    
    this.shuffleArray(availableTiles);
    
    for (var i = 0; i < Math.min(count, availableTiles.length); i++) 
    {
        var tile = availableTiles[i];
        this.enemies.push({
            x: tile.x, 
            y: tile.y, 
            health: 30,
            maxHealth: 30,
            attackPower: 5
        });
    }
};

Game.prototype.getItemAt = function(x, y) 
{
    for (var i = 0; i < this.items.length; i++) 
        if (this.items[i].x === x && this.items[i].y === y) 
            return this.items[i];
    return null;
};

Game.prototype.getEnemyAt = function(x, y) 
{
    for (var i = 0; i < this.enemies.length; i++) 
        if (this.enemies[i].x === x && this.enemies[i].y === y) 
            return this.enemies[i];
    return null;
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
            
            var hasHero = this.hero && this.hero.x === x && this.hero.y === y;
            var enemy = this.getEnemyAt(x, y);
            
            if (hasHero) 
                $tile.addClass('tileP');
            else if (enemy) 
                $tile.addClass('tileE');
            else 
            {
                if (tileType === 'W') $tile.addClass('tileW');
                else if (tileType === 'HP') $tile.addClass('tileHP');
                else if (tileType === 'SW') $tile.addClass('tileSW');
                else $tile.addClass('tile');
            }
            
            $tile.css({ left: x * this.tileSize + 'px', top: y * this.tileSize + 'px' });
            
            if (hasHero) 
            {
                var heroHealthPercent = (this.heroHealth / this.heroMaxHealth) * 100;
                var $heroHealth = $('<div class="health"></div>');
                $heroHealth.css('width', heroHealthPercent + '%');
                $tile.append($heroHealth);
            } 
            else if (enemy) 
            {
                var healthPercent = (enemy.health / enemy.maxHealth) * 100;
                var $health = $('<div class="health"></div>');
                $health.css('width', healthPercent + '%');
                $tile.append($health);
            }
            
            $field.append($tile);
        }
    }
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
