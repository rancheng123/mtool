<template>
    <ul id="navMenu" class="navMenu">

        <li class="navMenu-item">
            <a id="homeLink" class="link" @click.prevent="homeSelected">
              <i class="icon icon-home icon20"></i>
            </a>
        </li>

        <li class="navMenu-item">
            <a id="projectorLink" class="link" @click.prevent="projectorSelected">
              <i class="icon icon-projector icon20"></i>
              <!-- <span class="text">会议室投影</span> -->
            </a>
        </li>
        <li class="navMenu-item">
            <a id="printerLink" class="link" @click.prevent="printerSelected">
              <i class="icon icon-printer icon20"></i>
              <!-- <span class="text">打印机</span>  --> 
            </a> 
        </li>
        <li class="navMenu-item">
            <a id="configLink" class="link" @click.prevent="configSelected">
              <i class="icon icon-setting icon20"></i>
              <!-- <span class="text">配置</span>  --> 
            </a> 
        </li>
        <li class="navMenu-item">
            <a id="aboutLink" class="link" @click.prevent="aboutSelected">
              <i class="icon icon-about icon20"></i>
              <!-- <span class="text">关于</span> -->
            </a>
        </li>
    </ul>
</template>
<style lang="scss">
    @import "./NavMenu";
</style>
<script>
    import NavMenu from './NavMenu.js'
    export default NavMenu
</script>