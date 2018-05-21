$(function() {
	
	$(".search-form").on("submit", function(e) {
		var zipcodeEntry = $(this).find(".zipcode").val();

		if (zipcodeEntry !== "") {
			var zipcode = parseInt(zipcodeEntry);
			if ( isNaN(zipcode) || zipcode < 0 || zipcode > 99999 ) {
				$(this).parent().find(".validation-message").html("Your zipcode must be valid.");
				e.preventDefault();
			}
		}
	});

});