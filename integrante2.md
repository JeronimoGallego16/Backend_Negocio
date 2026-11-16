Vamos a seguir usando los componentes para los CRUDs. La tabla normal, la de ver detalles y la de crear y editar. Y para las asignaciones se va a crear una componente nueva que sea igual a la que está en asignar roles a usuarios. Y que cada página tenga la componente de los errores personalizados.  usar las mismas componentes que ya venimos usando porque todas las páginas son prácticamente lo mismo. Por último, las entidades que están en rojo no necesitan tener un frontend. 

Entidades y Atributos:
Jugador: id_jugador, nombre, apellido, fecha_nacimiento, genero, correo, identificación
Habilidad: id_habilidad, nombre, descripcion
HabilidadJugador: id_hablidad_jugador, nivel, observaciones, id_jugador, id_habilidad
EquipoJugador (Historial): id_historial, fecha_inicio, fecha_fin, id_jugador, id_equipo
Anotación: id_anotacion, id_partido, minuto, tipo, anulado, id_jugador

Relaciones:
Jugador – Equipo: N:N - EquipoJugador (Historial) 
Jugador – Habilidad: N:N - HabilidadJugador 
Jugador – Anotación: 1:N
Partido – Anotación: 1:N
