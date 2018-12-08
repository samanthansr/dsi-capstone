document.addEventListener("DOMContentLoaded", function() {
    var selectedProductsIdList = []
    
    var addKitchenProductButton = document.getElementById("add-kitchen-product-btn")
    addKitchenProductButton.addEventListener("click", function(){
        var selectedId = addProduct(0);
        selectedProductsIdList.push(selectedId)
    });

    var addVacuumProductButton = document.getElementById("add-vacuum-product-btn")
    addVacuumProductButton.addEventListener("click", function(){
        var selectedId = addProduct(1);
        selectedProductsIdList.push(selectedId)
    });

    var addStorageProductButton = document.getElementById("add-storage-product-btn")
    addStorageProductButton.addEventListener("click", function(){
        var selectedId = addProduct(2);
        selectedProductsIdList.push(selectedId)
    });

    var addBathProductButton = document.getElementById("add-bath-product-btn")
    addBathProductButton.addEventListener("click", function(){
        var selectedId = addProduct(3);
        selectedProductsIdList.push(selectedId)
    });
    
    function addProduct(index) {
        var products = document.getElementsByTagName("select");
        var selectedOption = products[index].options[products[index].selectedIndex];
        var selectedName = selectedOption.text;
        var selectedId = selectedOption.value;
        var selectedImg = selectedOption.getAttribute("data-imgurl");
        var parentDiv = document.getElementById("user-product-selection");
        var subDiv = document.createElement("div");

        var imgTag = document.createElement("img");
        imgTag.setAttribute("src", selectedImg);
        imgTag.setAttribute("alt", selectedName);
        imgTag.setAttribute("height", 150);
        imgTag.setAttribute("width", 150);
        subDiv.appendChild(imgTag);

        var imgLabel = document.createElement("p");
        imgLabel.appendChild(document.createTextNode(selectedName));
        subDiv.appendChild(imgLabel);

        parentDiv.append(subDiv);
        return selectedId;
    }
    
    function constructRequestURL(productIdList, n, ratio){
        productIdString = productIdList.join(',');
        string = `http://127.0.0.1:4000/recommend?product_id_list=${productIdString}&n=${n}&ratio=${ratio}`;
        return string;
    }
    
    function appendRecommendations(elementId, listOfRecommendations) {
        var parentDiv = document.getElementById(elementId)

        for (i=0; i<listOfRecommendations.length; i++) {
            var reccImg = listOfRecommendations[i]['imgurl']
            var reccName = listOfRecommendations[i]['name']

            var subDiv = document.createElement("div");

            subDiv.setAttribute("id", `recc-${i}`);
            
            var imgLabel = document.createElement("p");
            imgLabel.setAttribute("id", `recc-pdt-name-${i}`);
            imgLabel.appendChild(document.createTextNode(reccName));
            subDiv.appendChild(imgLabel);
            
            var imgTag = document.createElement("img");
            imgTag.setAttribute("src", reccImg);
            imgTag.setAttribute("alt", reccName);
            imgTag.setAttribute("height", 150);
            imgTag.setAttribute("width", 150);
            
            subDiv.appendChild(imgTag);

            parentDiv.appendChild(subDiv);
        };
    };

    function appendRecommendationHeader(elementClass, headerTitle) {
        var parentDiv = document.getElementsByClassName(elementClass)[0];
        var header = document.createElement("h3");
        header.appendChild(document.createTextNode(headerTitle));
        parentDiv.appendChild(header);
    };

    var getRecButton = document.getElementById("get-recommendations")
    getRecButton.addEventListener("click", function(){
        requestUrl = constructRequestURL(selectedProductsIdList, 10, 0.7)
        fetch(requestUrl)
            .then(data => {return data.json()})
            .then(res => {
                var listOfRecommendations = res;
                appendRecommendationHeader("all-recommendations-header", "Recommendations")
                appendRecommendations("all-recommendations", listOfRecommendations)
            });

        fetch("http://127.0.0.1:4000/random-recommend")
            .then(data => {return data.json()})
            .then(res => {
                var listOfRecommendations = res;
                appendRecommendationHeader("random-recommendations-header", "10 Random Recommendations")
                appendRecommendations("random-recommendations", listOfRecommendations)

            })
    })
});
