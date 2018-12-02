document.addEventListener("DOMContentLoaded", function() {
    var selected_products_id_list = []
    
    var addKitchenProductButton = document.getElementById("add-kitchen-product-btn")
    addKitchenProductButton.addEventListener("click", function(){
        var selected_id = addProduct(0);
        selected_products_id_list.push(selected_id)
    });

    var addVacuumProductButton = document.getElementById("add-vacuum-product-btn")
    addVacuumProductButton.addEventListener("click", function(){
        var selected_id = addProduct(1);
        selected_products_id_list.push(selected_id)
    });

    var addStorageProductButton = document.getElementById("add-storage-product-btn")
    addStorageProductButton.addEventListener("click", function(){
        var selected_id = addProduct(2);
        selected_products_id_list.push(selected_id)
    });

    var addBathProductButton = document.getElementById("add-bath-product-btn")
    addBathProductButton.addEventListener("click", function(){
        var selected_id = addProduct(3);
        selected_products_id_list.push(selected_id)
    });
    
    function addProduct(index) {
        var products = document.getElementsByTagName("select");
        var selected_option = products[index].options[products[index].selectedIndex];
        var selected_name = selected_option.text;
        var selected_id = selected_option.value;
        var selected_img = selected_option.getAttribute("data-imgurl");
        var parentDiv = document.getElementById("user-product-selection");
        var subDiv = document.createElement("div");

        var imgTag = document.createElement("img");
        imgTag.setAttribute("src", selected_img);
        imgTag.setAttribute("alt", selected_name);
        imgTag.setAttribute("height", 150);
        imgTag.setAttribute("width", 150);
        subDiv.appendChild(imgTag);

        var imgLabel = document.createElement("p");
        imgLabel.appendChild(document.createTextNode(selected_name));
        subDiv.appendChild(imgLabel);

        parentDiv.append(subDiv);
        return selected_id;
    }
    
    function constructRequestURL(product_id_list, n, ratio){
        product_id_string = product_id_list.join(',');
        string = `http://127.0.0.1:5000/recommend?product_id_list=${product_id_string}&n=${n}&ratio=${ratio}`;
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
        }
    }

    var getRecButton = document.getElementById("get-recommendations")
    getRecButton.addEventListener("click", function(){
        requestUrl = constructRequestURL(selected_products_id_list, 10, 0.7)
        fetch(requestUrl)
            .then(data => {return data.json()})
            .then(res => {
                var listOfRecommendations = res;
                appendRecommendations("all-recommendations", listOfRecommendations)    
            });

        fetch("http://127.0.0.1:5000/random-recommend")
            .then(data => {return data.json()})
            .then(res => {
                var listOfRecommendations = res;
                appendRecommendations("random-recommendations", listOfRecommendations)

            })
    })
});
