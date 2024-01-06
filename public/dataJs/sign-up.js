"use strict";

$("#new_register").on("submit", function (event) {
  var parametros = $(this).serialize();
  $.ajax({
    type: "POST",
    url: "./ajax/sign_up_ajax.php",
    data: parametros,
    beforeSend: function (objeto) {
      $("#resultados_ajax").html(
        "<img src='assets/images/loader.gif'/><br/>Wait a moment please..."
      );
    },
    success: function (datos) {
      $("#resultados_ajax").html(datos);

      $("html, body").animate(
        {
          scrollTop: 0,
        },
        600
      );
    },
  });
  event.preventDefault();
});
