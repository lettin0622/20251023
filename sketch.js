// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// !!! 新增：用於煙火效果的全域陣列 !!!
let fireworks = []; 
let gravity; // 新增：用於粒子重力的向量


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            // 注意：由於加入了動畫效果（煙火），noLoop() 會影響煙火顯示。
            // 建議在 setup() 中移除 noLoop()，或者在這裡判斷是否需要 loop()。
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // *** 移除 noLoop() 或將其註解掉，因為煙火需要連續繪製 (loop) ***
    // noLoop(); 
    
    // !!! 新增：設定重力加速度，向下 (Y 軸正向)
    gravity = createVector(0, 0.2);
    
    // 設定色彩模式為 HSB (色相、飽和度、亮度)，方便控制煙火顏色
    colorMode(HSB, 360, 255, 255, 255); 
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // !!! 調整背景：使用半透明背景，創造煙火拖尾效果 !!!
    background(0, 0, 0, 50); // 黑色，透明度為 50 (範圍 0-255)

    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;
    
    // 確保只在有分數時才進行計算，避免 NaN
    if (isNaN(percentage)) {
        percentage = 0;
    }

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(100, 200, 255); // 綠色 (HSB)
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // !!! 關鍵修改：發射煙火 !!!
        if (random(1) < 0.1) { // 每幀約有 10% 的機率發射一個新煙火
            // 發射位置在底部中間附近
            fireworks.push(new Firework(random(width * 0.3, width * 0.7))); 
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 (HSB)
        fill(45, 200, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 (HSB)
        fill(0, 200, 255); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(0, 0, 150); // 灰色 (HSB)
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(0, 0, 200); // 深灰 (HSB)
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(100, 200, 255, 150); // 帶透明度 (綠色 HSB)
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(45, 200, 255, 150); // 黃色 (HSB)
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
    
    // -----------------------------------------------------------------
    // C. 關鍵修改：更新和顯示煙火/粒子效果
    // -----------------------------------------------------------------
    
    // 遍歷所有煙火，更新它們的狀態
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].show();
        
        // 移除已完成的煙火
        if (fireworks[i].done()) {
            fireworks.splice(i, 1);
        }
    }
}


// =================================================================
// 步驟三：煙火和粒子系統類別定義
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否是上升中的主體
        this.lifespan = 255;
        this.hu = hu; // 色相
        this.acc = createVector(0, 0);

        if (this.firework) {
            // 上升中的煙火：垂直向上速度
            this.vel = createVector(0, random(-12, -8));
        } else {
            // 爆炸後碎片：隨機方向速度
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 爆炸速度
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 碎片受重力，並逐漸減速/消失
            this.applyForce(gravity);
            this.vel.mult(0.9); // 模擬空氣阻力或動能耗散
            this.lifespan -= 4; 
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        // 設置顏色和筆觸
        strokeWeight(this.firework ? 4 : 2);
        
        // 碎片顏色包含透明度（lifespan）
        stroke(this.hu, 255, 255, this.lifespan);
        
        point(this.pos.x, this.pos.y);
    }
}

class Firework {
    constructor(launchX) {
        // 煙火的顏色，每次隨機
        this.hu = random(360); 
        this.firework = new Particle(launchX, height, this.hu, true); // 在底部發射
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            // 檢查是否達到爆炸點 (速度開始變慢，即 Y 軸速度由負變正)
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸後的粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 爆炸產生大量粒子
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }

        // 顯示爆炸後的粒子
        for (let p of this.particles) {
            p.show();
        }
    }

    done() {
        // 煙火完成條件：已爆炸且所有碎片都已消失
        return this.exploded && this.particles.length === 0;
    }
}
