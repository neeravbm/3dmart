var renderer = null,
    scene = null,
    camera = null,
    meshes = [];

function render() {
    renderer.render(scene, camera);
}

(function ($, THREE) {
    Drupal.behaviors.model3d_integration_render_product_display = {
        attach: function (context, settings) {

            var target = $('#render-target');

            var width = target.innerWidth();
            var height = target.innerHeight();

            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setSize(width, height);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            target.append(renderer.domElement);

            scene = new THREE.Scene;

            var light = new THREE.AmbientLight(0xFFFFFF);
            light.color.setRGB(0.8, 0.8, 0.8);
            scene.add(light);

            addFloodLights(new THREE.Vector3(0, 4, 0), scene, THREE);

            camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
            camera.position.set(0, 1, -2);
            camera.up = new THREE.Vector3(0, 1, 0);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            var product_display = settings.model3d_integration.product_display;
            var product = product_display.product;

            $.each(product.object_for_products, function (index_ofp, element_ofp) {
                var object = element_ofp.object;
                var mesh = loadObject(object, $);
                if (element_ofp.operations.length) {
                    operate(mesh, element_ofp.operations, $);
                }
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                var helper = new THREE.BoundingBoxHelper(mesh, 0xff0000);
                helper.update();
                //scene.add(helper);
                console.log(helper.box.min);
                console.log(helper.box.max);

                mesh.translateY(-helper.box.min.y);

                controls = new THREE.TransformControls(camera, renderer.domElement);
                controls.addEventListener('change', render);
                /*mesh.geometry.computeBoundingBox();
                 var bBoxOffset = mesh.geometry.boundingBox.center();
                 mesh.geometry.vertices.forEach(function (vertex) {
                 vertex.sub(bBoxOffset);
                 });
                 mesh.geometry.computeBoundingSphere();
                 mesh.geometry.computeBoundingBox();
                 mesh.geometry.verticesNeedUpdate = true;
                 mesh.position.set(bBoxOffset.applyMatrix4(mesh.matrix));*/
                controls.attach(mesh);
                controls.visible = false;

                mesh.controls = controls;

                scene.add(controls);

                scene.add(mesh);
                meshes.push(mesh);
            });

            target.mousedown(meshes, onDocumentMouseDown);

            geometry = new THREE.PlaneGeometry(3, 3);
            var material = new THREE.MeshPhongMaterial({color: 0xa8a8a8, side: THREE.BackSide});
            var plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = Math.PI / 2;
            plane.position.y = -0.001;
            plane.receiveShadow = true;
            scene.add(plane);

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.25;
            controls.enableZoom = true;

            controls.minDistance = 0.5;
            controls.maxDistance = 5;

            controls.minPolarAngle = 0;

            // Don't let go below the ground.
            controls.maxPolarAngle = 2 * Math.PI / 5;

            controls.addEventListener('change', render);

            renderer.render(scene, camera);

            //animate();
        }
    };
})(jQuery, THREE);