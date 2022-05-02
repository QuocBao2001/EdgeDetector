window.onload = function() {
    const canvas = document.querySelector("canvas")
    const ctx = canvas.getContext("2d")
    const video = document.querySelector("video")
    const crrThreshold = document.getElementById("threshold")
    const crrMethod = document.getElementById("methods")

    // Lấy ngưỡng và phương pháp lọc biên cạnh
    var threshold = parseInt(crrThreshold.value)
    var method = parseInt(crrMethod.value)

    // hàm nhận sự kiện thay đổi ngưỡng
    crrThreshold.oninput = ()=>{
        threshold = parseInt(crrThreshold.value)
    }

    // hàm nhận sự kiện thay đổi phương pháp
    crrMethod.onchange = ()=>{
        method = parseInt(crrMethod.value)
    }

    // hàm nhận sự kiện video
    video.onplay = function() {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        function loop() {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            var frame = ctx.getImageData(0,0,canvas.width, canvas.height)
            var data = frame.data
            // chuyển RGB sang Grayscale
            for(var i = 0; i < data.length; i+=4) {
                var r = data[i];
                var g = data[i+1];
                var b = data[i+2];
                var brightness = (3*r+4*g+b)>>>3;
                data[i] = brightness;
                data[i+1] = brightness;
                data[i+2] = brightness;
            }
            frame.data = data;
            // đưa vào các hàm lọc biên cạnh
            if (method == 0)
                frame = Sobel(frame, threshold)
            else if (method == 1)
                frame = Frewitt(frame, threshold)
            else if (method == 2)
                frame = FreiChen(frame, threshold)
            ctx.putImageData(frame,0,0);
            requestAnimationFrame(loop)
        }
        requestAnimationFrame(loop);
    }
}

// Xây dựng mảng lookup cho phép convolution 3x3
function lookup(rowStep){
    var colStep = 4
    var index = new Array()
    index.push(-rowStep-colStep)
    index.push(-rowStep)
    index.push(-rowStep+colStep)
    index.push(-colStep)
    index.push(0)
    index.push(+colStep)
    index.push(+rowStep-colStep)
    index.push(+rowStep)
    index.push(+rowStep+colStep)
    return index
}

// Phép convolution cho các toán tử tìm biên cạnh theo đạo hàm 
function ConvlEdge(imgData, kernel1, kernel2, threshold){
    var row = imgData.height
    var col = imgData.width
    var colStep = 4
    var rowStep = 4*col
    var neighbors = lookup(rowStep)
    var newValue = new ImageData(col, row)
    for (var i = 4*(row+1); i < 4*(row*(col - 1) - 1); i += colStep){
        var dx = 0, dy = 0
        // tính đạo hàm theo phương x và phương y
        for (var k = 0; k < 9; k ++){
            dx += kernel1[k]*imgData.data[i+neighbors[k]]
            dy += kernel2[k]*imgData.data[i+neighbors[k]]
        }
        // tính gradient của đạo hàm
        var grad = Math.sqrt(dx*dx + dy*dy)
        // lọc ngưỡng
        if (grad >= threshold)
            newValue.data[i] = newValue.data[i+1] = newValue.data[i+2] = 255
        else
            newValue.data[i] = newValue.data[i+1] = newValue.data[i+2] = 0
        newValue.data[i+3] = 255;
    }
    return newValue
}

// Các hàm lọc biên cạnh với trọng số tương ứng
//
function Sobel(imgData, threshold){
    const kernelx = [1, 0, -1, 2, 0, -2, 1, 0, -1]
    const kernely = [-1, -2, -1, 0, 0, 0, 1, 2, 1]
    newImage = ConvlEdge(imgData, kernelx, kernely, threshold)
    return newImage
}

function Frewitt(imgData, threshold){
    const kernelx = [1, 0, -1, 1, 0, -1, 1, 0, -1]
    const kernely = [-1, -1, -1, 0, 0, 0, 1, 1, 1]
    newImage = ConvlEdge(imgData, kernelx, kernely, threshold)
    return newImage
}

function FreiChen(imgData, threshold){
    const sqrt2 = Math.sqrt(2)
    const kernelx = [1, 0, -1, sqrt2, 0, -sqrt2, 1, 0, -1]
    const kernely = [-1, -sqrt2, -1, 0, 0, 0, 1, sqrt2, 1]
    newImage = ConvlEdge(imgData, kernelx, kernely, threshold)
    return newImage
}