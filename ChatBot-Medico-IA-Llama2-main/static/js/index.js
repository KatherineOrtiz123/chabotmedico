$(document).ready(function () {
    var conversacion = []; // Almacena el historial de conversación

    var videoStream; // Variable para almacenar el flujo de video

    // Función para iniciar la transmisión de video desde la cámara del dispositivo
    function iniciarCamara() {
        // Obtener el elemento de video
        var videoElement = document.getElementById("videoElement");

        // Verificar si el navegador es compatible con la API de medios y si la cámara está disponible
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function (stream) {
                // Almacenar el flujo de video en la variable
                videoStream = stream;
                // Mostrar la transmisión de video en el elemento de video
                videoElement.srcObject = stream;
            })
            .catch(function (error) {
                console.log("Error al acceder a la cámara:", error);
            });
    }

    // Llamar a la función para iniciar la transmisión de video cuando se hace clic en el botón "Abrir Cámara"
    $("#abrirCamara").on("click", function () {
        iniciarCamara();
    });

    $("#buscar").on("click", function () {
        var preguntaActual = $("#inputPregunta").val().trim();
        if (preguntaActual === "") {
            alert("Por favor, escribe una pregunta.");
            return;
        }

        // Agregar la pregunta actual al historial de conversación
        conversacion.push({ pregunta: preguntaActual, respuesta: "" });

        var cuerpo = {
            model: "llama3",
            prompt: preguntaActual + ' Soy un chatbot médico especializado.',
            stream: true
        };

        $.ajax({
            type: "POST",
            url: "http://localhost:11434/api/generate", // Cambia el puerto si es diferente
            data: JSON.stringify(cuerpo),
            contentType: "application/json",
            xhrFields: {
                onprogress: function (e) {
                    var response = e.currentTarget.response;
                    var lines = response.split('\n');
                    var respuestaAcumulada = ""; // Variable para acumular la respuesta
                    lines.forEach(function (line) {
                        if (line.trim() !== '') {
                            try {
                                var responseObject = JSON.parse(line);
                                if (responseObject && responseObject.response) {
                                    respuestaAcumulada += responseObject.response + " "; // Acumular la respuesta
                                    $("#textaRespuesta").val(respuestaAcumulada); // Mostrar la respuesta acumulada en el textarea mientras se recibe
                                }
                            } catch (e) {
                                console.error("Error parsing line: ", line);
                            }
                        }
                    });
                }
            },
            success: function (data) {
                var respuestaActual = $("#textaRespuesta").val();

                // Actualizar el historial de conversación con la respuesta actual
                conversacion[conversacion.length - 1].respuesta = respuestaActual;

                // Mostrar la conversación actualizada en el cuadro de conversación
                actualizarConversacion();

                // Limpiar los campos después de enviar la pregunta
                $("#inputPregunta").val('');
                $("#textaRespuesta").val('');
            },
            error: function () {
                alert("Error en la comunicación con el servidor.");
            }
        });
    });

    // Manejar el evento click del botón de video
    $("#video").on("click", function () {
        if ($("#videoContainer").is(':empty')) {
            // Agregar el párrafo con el texto "Cámara" al contenedor
            var parrafoCamara = $("<p>", {
                text: "Cámara",
                style: "text-align: center; font-size: 24px;"
            });
            $("#videoContainer").append(parrafoCamara);
            // Ocultar el botón de video después de abrir el video
            $("#video").hide();
        }
    });

    // Función para actualizar la conversación en el cuadro de conversación
    function actualizarConversacion() {
        $("#conversacion").empty();
        conversacion.forEach(function (item) {
            var nuevoParrafo = $("<p></p>").html(`<strong>Tú:</strong> ${item.pregunta}<br><strong>ChatBot:</strong> ${item.respuesta}`);
            $("#conversacion").append(nuevoParrafo);
        });
    }
});
