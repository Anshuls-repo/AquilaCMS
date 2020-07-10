angular.module("aq.gallery.controllers", []).controller("GalleryListCtrl", [
    "$scope", "$location", "GalleryService", function ($scope, $location, GalleryService) {
        $scope.galleries = [];

        $scope.goToGalleryDetails = function (galleryId) {
            $location.path("/component/gallery/" + galleryId);
        };

        GalleryService.list({ skip: 0, limit: 100 }, function (res) {
            $scope.galleries = res.datas;
        });
    }
]).controller("GalleryDetailCtrl", [
    "$rootScope", "$scope", "$routeParams", "$location", "GalleryService", "GalleryItemService", "toastService", "$modal",
    function ($rootScope, $scope, $routeParams, $location, GalleryService, GalleryItemService, toastService, $modal) {
        var isDrop = false;

        $scope.isEditMode = false;
        $scope.disableSave = true;
        $scope.gallery = {};

        if ($routeParams.id !== "new") {
            $scope.isEditMode = true;

            GalleryService.detail({ id: $routeParams.id }, function (res) {
                $scope.gallery = res;
                $scope.disableSave = false;
            });
        }
        else {
            $scope.gallery = { code: "", initItemNumber: 12, maxColumnNumber: 4 };
        }

        $rootScope.dropEvent ? $rootScope.dropEvent() : null;
        $rootScope.dropEvent = $rootScope.$on("dropEvent", function (evt, dragged, dropped) {
            var transOrder = dragged.order;
            dragged.order = dropped.order;
            dropped.order = transOrder;
            $scope.$apply();
        });

        $scope.checkValidity = function () {
            if ($scope.gallery && $scope.gallery.code && $scope.gallery.code !== "" && $scope.gallery.initItemNumber && $scope.gallery.initItemNumber > 0 && $scope.gallery.maxColumnNumber && $scope.gallery.maxColumnNumber > 0) {
                $scope.disableSave = false;
            }
            else {
                $scope.disableSave = true;
            }
        };

        function saveGallery(quit) {
            GalleryService.save($scope.gallery, function (res) {
                if ($scope.isEditMode) {
                    toastService.toast("success", "Sauvegarde effectuée");
                }
                else {
                    $location.path("/component/gallery/" + res._id);
                }

                if (quit) {
                    $location.path("/component/gallery");
                }
            }, function (err) {
                    console.error(err);
                    toastService.toast("danger", "Echec de la sauvegarde");
                });
        }

        $scope.save = function (quit) {
            if ($scope.gallery.items && $scope.gallery.items.length > 0) {
                GalleryItemService.saveAll({ id: $scope.gallery._id }, $scope.gallery.items, function () {
                    saveGallery(quit);
                }, function (err) {
                        console.error(err);
                        toastService.toast("danger", "Echec de la sauvegarde");
                    });
            }
            else {
                saveGallery(quit);
            }
        };

        $scope.delete = function () {
            if (confirm("Êtes-vous sûr de vouloir supprimer cette gallerie ?")) {
                GalleryService.delete({ id: $scope.gallery._id }, function () {
                    toastService.toast("success", "Suppression effectuée");
                    $location.path("/component/gallery");
                }, function (err) {
                        console.error(err);
                        toastService.toast("danger", "Echec de la suppression");
                    });
            }
        };

        $scope.openItemModal = function (item) {
            $modal.open({
                templateUrl: 'app/gallery/views/modals/gallery-item.html',
                controller: 'GalleryItemCtrl',
                resolve: {
                    gallery: function () {
                        return $scope.gallery;
                    },
                    item: function () {
                        return item;
                    }
                }
            }).result.then(function () {
                GalleryService.detail({ id: $routeParams.id }, function (res) {
                    $scope.gallery = res;
                    $scope.disableSave = false;
                });
            });
        };

        $scope.getImage = function(img) {
            const filename = img.src.split('/')[img.src.split('/').length -1];
            return `/images/gallery/200x200/${img._id}/${filename}`;
        }
    }
]).controller("GalleryItemCtrl", [
    "$scope", "$modalInstance", "GalleryItemService", "gallery", "item", "toastService", "$translate", function ($scope, $modalInstance, GalleryItemService, gallery, item, toastService, $translate) {
        $scope.isEditMode = false;
        $scope.item = { type: "photo", content: "", src: "", srcset: [], alt: "" };
        $scope.showLoader = false;
        $scope.gallery = gallery;
        var lastOrder = 0;

        for (var i = 0; i < gallery.items.length; i++) {
            if (lastOrder < gallery.items[i].order) {
                lastOrder = gallery.items[i].order;
            }
        }

        $scope.item.order = lastOrder + 1;

        if (item) {
            $scope.isEditMode = true;
            $scope.item = angular.copy(item);
        }

        $scope.save = function () {
            if ($scope.item.type === "photo") {
                $scope.item.content = "";
            }
            else if ($scope.item.type === "video") {
                $scope.item.src = "";
                $scope.item.srcset = [];
            }

            GalleryItemService.save({ id: gallery._id }, $scope.item, function (response) {
                toastService.toast("success", $translate.instant('gallery.item.updated'));
                $modalInstance.close();
            }, function (response) {
                toastService.toast("danger", response.data.message);
            });
        };

        $scope.close = function(isEditMode) {
            if (isEditMode) {
                toastService.toast("success", $translate.instant('gallery.item.updated'));
            }
            else {
                toastService.toast("success", $translate.instant('gallery.item.added'));
            }
            $modalInstance.close();
        };

        $scope.cancel = function (event) {
            event.preventDefault();
            $modalInstance.dismiss("cancel");
        };

        $scope.delete = function (event) {
            event.preventDefault();
            GalleryItemService.delete({ id: gallery._id, itemId: $scope.item._id }, function () {
                $modalInstance.close();
            });
        };

        $scope.getImage = function(img) {
            const filename = img.src.split('/')[img.src.split('/').length -1];
            return `/images/gallery/200x200/${img._id}/${filename}`;
        }
    }
]);