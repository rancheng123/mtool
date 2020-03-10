<template>
    <div class="account">
        <div class="accountPanel">
            <div class="account-info">
                <div class="username">{{userInfo.fullName}}</div>
                <div class="phone">{{userInfo.phoneNumber}}</div>
                <div class="btn-area">
                    <button class="btn btn-color-gray-1" @click.prevent="logout">退出</button>
                </div>

            </div>
        </div>
    </div>

</template>


<style lang="scss">
@import "./Account";
</style>
<script>
export { default } from './Account'
</script>
