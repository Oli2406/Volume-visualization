class rayShader extends Shader {
    constructor(volume, iso){
        super("ray_vert", "ray_frag");

        let volumeTexture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
        volumeTexture.format = THREE.RedFormat;
        volumeTexture.type = THREE.FloatType;
        volumeTexture.minFilter = volumeTexture.magFilter = THREE.LinearFilter;
        volumeTexture.unpackAlignment = 1;
        volumeTexture.needsUpdate = true;

        this.setUniform("volume", volumeTexture);
        this.setUniform("iso", iso);
        let hexColor = document.getElementById("myColor").value;
        let execArray = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
        let rgbColor = [parseInt(execArray[1], 16), parseInt(execArray[2], 16), parseInt(execArray[3], 16)];

        this.setUniform("color", new THREE.Vector3(rgbColor[0], rgbColor[1], rgbColor[2]), "v3v");
        this.setUniform("scale", new THREE.Vector3(volume.width, volume.height, volume.depth), "v3v");
    }
}