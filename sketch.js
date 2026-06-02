let stars = [];
const starColors = ['#CECEFF', '#ACD6FF', '#CAFFFF', '#C1FFE4', '#FFFFB9'];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始化 20 個星星粒子
  for (let i = 0; i < 20; i++) {
    stars.push(new Star());
  }
}

function draw() {
  // 背景設為半透明黑色，產生淡淡的拖影效果 (數值越小拖影越長)
  background(0, 40);
  
  // 每隔 3 秒產生一個新的星星 (預設幀率為 60fps，3秒=180幀)
  if (frameCount % 180 === 0) {
    stars.push(new Star());
  }

  // 處理星星之間的碰撞
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      stars[i].collide(stars[j]);
    }
  }

  // 更新並顯示所有星星
  for (let star of stars) {
    star.update();
    star.display();
  }
}

// 當視窗改變大小時，自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 定義星星粒子 Class
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(20, 45); // 星星的基礎大小
    this.vx = random(-2, 2);    // X軸移動速度
    this.vy = random(-2, 2);    // Y軸移動速度
    this.color = random(starColors); // 從指定色系中隨機挑選
    
    this.isScared = false;
    this.angleToMouse = 0;
    this.flashTimer = 0; // 用來控制閃爍效果的計時器
  }

  collide(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = dist(this.x, this.y, other.x, other.y);
    let minDist = this.size + other.size; // 碰撞判定距離

    if (distance < minDist && distance > 0) {
      // 1. 將兩者推開，避免重疊卡住
      let overlap = (minDist - distance) / 2;
      let nx = dx / distance;
      let ny = dy / distance;
      
      this.x -= nx * overlap;
      this.y -= ny * overlap;
      other.x += nx * overlap;
      other.y += ny * overlap;

      // 2. 計算基於質量(以面積代入)的彈性碰撞
      let m1 = this.size * this.size;
      let m2 = other.size * other.size;
      
      let v1n = nx * this.vx + ny * this.vy;
      let v2n = nx * other.vx + ny * other.vy;
      
      let v1nAfter = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
      let v2nAfter = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);
      
      this.vx += nx * (v1nAfter - v1n);
      this.vy += ny * (v1nAfter - v1n);
      other.vx += nx * (v2nAfter - v2n);
      other.vy += ny * (v2nAfter - v2n);
      
      // 觸發碰撞閃光計時
      this.flashTimer = 15;
      other.flashTimer = 15;
    }
  }

  update() {
    // 限制最高速度避免碰撞後飛太快
    let maxSpeed = 8;

    // 更新閃爍計時器，大於0時遞減
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }

    this.vx = constrain(this.vx, -maxSpeed, maxSpeed);
    this.vy = constrain(this.vy, -maxSpeed, maxSpeed);

    // 預設的緩慢漂移
    this.x += this.vx;
    this.y += this.vy;

    // 碰到邊界時從另一邊出現 (無縫循環)
    if (this.x < -this.size * 2) this.x = width + this.size * 2;
    if (this.x > width + this.size * 2) this.x = -this.size * 2;
    if (this.y < -this.size * 2) this.y = height + this.size * 2;
    if (this.y > height + this.size * 2) this.y = -this.size * 2;

    // 計算與滑鼠的距離與角度
    let d = dist(mouseX, mouseY, this.x, this.y);
    this.angleToMouse = atan2(mouseY - this.y, mouseX - this.x);

    // 滑鼠靠近時的互動邏輯 (驚嚇與逃跑)
    let reactDistance = 150; // 觸發距離
    if (d < reactDistance) {
      this.isScared = true;
      // 距離越近，反向逃跑的推力越大
      let repelForce = map(d, 0, reactDistance, 8, 1);
      this.x -= cos(this.angleToMouse) * repelForce;
      this.y -= sin(this.angleToMouse) * repelForce;
    } else {
      this.isScared = false;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    // --- 繪製碰撞閃光效果 ---
    if (this.flashTimer > 0) {
      noStroke();
      // 根據計時器剩餘時間計算透明度，產生漸弱效果
      let flashAlpha = map(this.flashTimer, 0, 15, 0, 200);
      fill(255, 255, 255, flashAlpha); 
      circle(0, 0, this.size * 2.5); // 畫一個比星星本身大的發光圓圈
    }

    // --- 繪製圓角星星 ---
    fill(this.color);
    stroke(this.color);
    strokeWeight(this.size * 0.4); // 利用粗邊框來製造圓角效果
    strokeJoin(ROUND); // 設定線條交界為圓滑
    this.drawStarShape(0, 0, this.size * 0.4, this.size, 5); // 畫出5角星
    noStroke(); // 畫完星星後取消邊框，避免影響眼睛和嘴巴

    // --- 繪製眼睛 ---
    let eyeOffsetX = this.size * 0.35;
    let eyeOffsetY = -this.size * 0.15;
    
    // 如果受到驚嚇，眼睛跟眼球都變大
    let eyeRadius = this.isScared ? this.size * 0.4 : this.size * 0.25;
    let pupilRadius = this.isScared ? eyeRadius * 0.5 : eyeRadius * 0.4;

    // 計算眼球跟隨滑鼠轉動的偏移量
    let maxPupilOffset = eyeRadius - pupilRadius - 1; 
    let pupilOffsetX = cos(this.angleToMouse) * maxPupilOffset;
    let pupilOffsetY = sin(this.angleToMouse) * maxPupilOffset;

    // 左眼
    fill(255); // 眼白
    circle(-eyeOffsetX, eyeOffsetY, eyeRadius * 2);
    fill(0);   // 眼球
    circle(-eyeOffsetX + pupilOffsetX, eyeOffsetY + pupilOffsetY, pupilRadius * 2);

    // 右眼
    fill(255); // 眼白
    circle(eyeOffsetX, eyeOffsetY, eyeRadius * 2);
    fill(0);   // 眼球
    circle(eyeOffsetX + pupilOffsetX, eyeOffsetY + pupilOffsetY, pupilRadius * 2);

    // --- 繪製嘴巴 ---
    let mouthY = this.size * 0.15;
    if (this.isScared) {
      // 驚嚇時：張大嘴巴 (O型嘴)
      fill(0);
      ellipse(0, mouthY + this.size * 0.2, this.size * 0.4, this.size * 0.6);
    } else {
      // 正常時：圓弧微笑
      noFill();
      stroke(0);
      strokeWeight(this.size * 0.08);
      strokeCap(ROUND);
      arc(0, mouthY, this.size * 0.6, this.size * 0.4, 0, PI);
    }

    pop();
  }

  // 繪製基本星星形狀的輔助函式
  drawStarShape(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    // 從正上方開始繪製，讓星星站直
    for (let a = -PI / 2; a < TWO_PI - PI / 2; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }
}
