
before(function() {
	//browser.url('/Contact-Us/contactus.html');
	browser.url('/');
});

var assert= require('assert');
var itemPrices = {};
const arrItems = ["Sauce Labs Bolt T-Shirt", "Sauce Labs Bike Light", "Sauce Labs Fleece Jacket"];
const removeItem = ["Sauce Labs Fleece Jacket"];
const addItem = ["Sauce Labs Onesie"];

describe("Log in to saucedemo.com", function(){
	it("submit the log in", function(done) {
		submitLogin("standard_user", "secret_sauce");
	});

	it("Add items to cart and verify the correct items are added to cart", function(done) {

		browser.selectByValue(".product_sort_container", 'lohi');
		addItemToCart(arrItems);
		clickButton("path");

		verifyItemsInCartOrCheckout("cart");
	});

	it("Remove and add another item. Validate the items and total price in checkout page.", function(done) {
		removeItemFromCart(removeItem);	
		clickButton(".cart_footer .btn_secondary");

		addItemToCart(addItem);
		clickButton("path");

		clickButton(".btn_action.checkout_button");
		fillOutCheckoutInfo("xyz", "abc", 10901, true);

		verifyItemsInCartOrCheckout("checkout");
		verifyTotal();
		clickButton(".btn_action.cart_button");
	});	
});	


function clickButton (buttonName) {

	browser.waitUntil(function () {
      	return browser.isEnabled(buttonName)
   		}, 500, 'wait for button to be enabled every 500ms');

	browser.click(buttonName);
}

function fillOutCheckoutInfo(firstName, lastName, zipCode, doYouWantToSubmit) {

	browser.waitUntil(function () {
      return browser.isEnabled('input#first-name')
    }, 500, 'expected text to be different after 5s');
	
	(firstName) ? browser.setValue("input#first-name", firstName) : "";
	(lastName) ? browser.setValue("input#last-name", lastName) : "";
	(zipCode) ? browser.setValue("input#postal-code", zipCode) : "";
	(doYouWantToSubmit) ? clickButton(".btn_primary.cart_button") : "";	
}
		

function addItemToCart(arrItems)
{
	for (var i = 0; i < arrItems.length; i++)
	{
		for (var j=1; j <=6; j++)
		{
			var itemName = browser.getText(".inventory_list .inventory_item:nth-of-type(" + j + ") .inventory_item_name");

			if (itemName === arrItems[i])
			{
				var displayItemPrice = browser.getText("div:nth-of-type(" + j + ") > .pricebar > .inventory_item_price");				
				itemPrices[arrItems[i]] = displayItemPrice;				

				clickButton("div:nth-of-type(" + j + ") > .pricebar > .btn_inventory.btn_primary");
				break;
			}
			if (j==6)
			{
				itemPrices[arrItems[i]] = null;
			}	
		}

	}
}

function removeItemFromCart(arrItems) {

	var cartRowCount = findNumRowsInCart("cart");

	for (var i=0; i < arrItems.length; i++)
	{
		for (var j=0; j < cartRowCount; j++)
		{
			var cartItemName = getItemNamePrice(j, "itemName"); 
			
			if (cartItemName === arrItems[i])
			{
				clickButton(".cart_list > div:nth-of-type(" + (j+3) + ") .btn_secondary.cart_button");				
				break;
			}
			if (j == (cartRowCount - 1))
			{
				console.log(arrItems[i] + " is not found in cart. Can't remove it");
			}	
		}
		delete itemPrices[arrItems[i]];
	}
}

function findNumRowsInCart(pageName) {
	
	var rowHeight = (pageName == "checkout") ? 152 : 184;
	var cartListHeight = browser.getElementSize(".cart_list", 'height')

	if (browser.isExisting('.cart_list') && cartListHeight > 71)
	{
		var cartListHeight = browser.getElementSize(".cart_list", 'height');
		var qtyHeight = browser.getElementSize(".cart_quantity_label", 'height');
		
		return (cartListHeight - qtyHeight) / rowHeight;		
	}	
	return 0;	
}


function submitLogin(userName, pwd) {

	//browser.url('/');
	(userName) ? browser.setValue("#user-name", userName) : "";
	(pwd) ? browser.setValue("#password", pwd) : "";
	browser.click("[type='submit']");		
}


function verifyItemsInCartOrCheckout(pageName) {

	var cartRowCount = findNumRowsInCart(pageName);
	var itemFound = 0;
	var itemsNotInCartCheckout = [];
	var itemsWithIncorrectPrice = [];
	var itemPricesObjSize = Object.keys(itemPrices).length;
	var isPriceMatch = true;
	
	if (cartRowCount > itemPricesObjSize) {

		assert.equal(arrItems.length, cartRowCount, "There are " + (cartRowCount - itemPricesObjSize) + " extra item in " + pageName);
	}
	else {	
		for (var key in itemPrices)
		{
			for (var j=0; j < cartRowCount; j++)
			{
				var cartItemName = getItemNamePrice(j, "itemName");

				if (cartItemName == key)
				{
					itemFound++;

					if (pageName == "checkout")
					{
						var itemPrice = getItemNamePrice(j, "itemPrice");

						if (itemPrice != itemPrices[key]) 
						{
							isPriceMatch = false;
							itemsWithIncorrectPrice.push(key);
						}	
					}
					break;
				}

				if (j == cartRowCount - 1)
				{
					itemsNotInCartCheckout.push(key);
				} 				
			}			
		}		
		assert.equal(itemPricesObjSize, itemFound, "The following items weren't added to " + pageName + ": " + itemsNotInCartCheckout);

		if (pageName == "checkout")
		{
			assert.equal(true, isPriceMatch, "The following items have incorrect price in " + pageName + ": " + itemsWithIncorrectPrice);
		}
	}
}

function verifyTotal() {

	var total = Number(browser.getText(".summary_total_label").substring(8));
	var myItemTotal = 0;

	for (var key in itemPrices)
	{			
		myItemTotal += Number(itemPrices[key].substring(1));
	}

	myTotal = Math.round(myItemTotal * 1.08 * 100) / 100;

	assert.equal(myTotal, total, "Total price is incorrect. Expected: " + myTotal + ", Actual: " + total);
}


function getItemNamePrice(num, type) {

	var innerText = browser.getHTML("div:nth-of-type(" + (num + 3) + ") > .cart_item_label", false);

	var tempIndex = (type == "itemName") ? innerText.indexOf("inventory_item_name") : innerText.indexOf("inventory_item_price");
	var startIndex = innerText.indexOf(">", tempIndex);
	var endIndex = innerText.indexOf("</div>", startIndex);
	
	return innerText.substring(startIndex + 1 ,endIndex);
}

