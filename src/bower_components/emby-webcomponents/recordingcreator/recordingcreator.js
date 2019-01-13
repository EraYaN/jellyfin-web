define(["dialogHelper", "globalize", "layoutManager", "mediaInfo", "apphost", "connectionManager", "require", "loading", "scrollHelper", "datetime", "imageLoader", "recordingFields", "events", "emby-checkbox", "emby-button", "emby-collapse", "emby-input", "paper-icon-button-light", "css!./../formdialog", "css!./recordingcreator", "material-icons"], function(dialogHelper, globalize, layoutManager, mediaInfo, appHost, connectionManager, require, loading, scrollHelper, datetime, imageLoader, recordingFields, events) {
    "use strict";

    function closeDialog() {
        dialogHelper.close(currentDialog)
    }

    function init(context) {
        context.querySelector(".btnPlay").addEventListener("click", function() {
            closeAction = "play", closeDialog()
        }), context.querySelector(".btnCancel").addEventListener("click", function() {
            closeAction = null, closeDialog()
        })
    }

    function getImageUrl(item, apiClient, imageHeight) {
        var imageTags = item.ImageTags || {};
        return item.PrimaryImageTag && (imageTags.Primary = item.PrimaryImageTag), imageTags.Primary ? apiClient.getScaledImageUrl(item.Id, {
            type: "Primary",
            maxHeight: imageHeight,
            tag: item.ImageTags.Primary
        }) : imageTags.Thumb ? apiClient.getScaledImageUrl(item.Id, {
            type: "Thumb",
            maxHeight: imageHeight,
            tag: item.ImageTags.Thumb
        }) : null
    }

    function renderRecording(context, defaultTimer, program, apiClient, refreshRecordingStateOnly) {
        if (!refreshRecordingStateOnly) {
            var imgUrl = getImageUrl(program, apiClient, 200),
                imageContainer = context.querySelector(".recordingDialog-imageContainer");
            imgUrl ? (imageContainer.innerHTML = '<img src="' + require.toUrl(".").split("?")[0] + '/empty.png" data-src="' + imgUrl + '" class="recordingDialog-img lazy" />', imageContainer.classList.remove("hide"), imageLoader.lazyChildren(imageContainer)) : (imageContainer.innerHTML = "", imageContainer.classList.add("hide")), context.querySelector(".recordingDialog-itemName").innerHTML = program.Name, context.querySelector(".formDialogHeaderTitle").innerHTML = program.Name, context.querySelector(".itemGenres").innerHTML = (program.Genres || []).join(" / "), context.querySelector(".itemOverview").innerHTML = program.Overview || "";
            var formDialogFooter = context.querySelector(".formDialogFooter"),
                now = new Date;
            now >= datetime.parseISO8601Date(program.StartDate, !0) && now < datetime.parseISO8601Date(program.EndDate, !0) ? formDialogFooter.classList.remove("hide") : formDialogFooter.classList.add("hide"), context.querySelector(".itemMiscInfoPrimary").innerHTML = mediaInfo.getPrimaryMediaInfoHtml(program)
        }
        context.querySelector(".itemMiscInfoSecondary").innerHTML = mediaInfo.getSecondaryMediaInfoHtml(program, {}), loading.hide()
    }

    function reload(context, programId, serverId, refreshRecordingStateOnly) {
        loading.show();
        var apiClient = connectionManager.getApiClient(serverId),
            promise1 = apiClient.getNewLiveTvTimerDefaults({
                programId: programId
            }),
            promise2 = apiClient.getLiveTvProgram(programId, apiClient.getCurrentUserId());
        Promise.all([promise1, promise2]).then(function(responses) {
            var defaults = responses[0],
                program = responses[1];
            renderRecording(context, defaults, program, apiClient, refreshRecordingStateOnly)
        })
    }

    function executeCloseAction(action, programId, serverId) {
        if ("play" === action) return void require(["playbackManager"], function(playbackManager) {
            var apiClient = connectionManager.getApiClient(serverId);
            apiClient.getLiveTvProgram(programId, apiClient.getCurrentUserId()).then(function(item) {
                playbackManager.play({
                    ids: [item.ChannelId],
                    serverId: serverId
                })
            })
        })
    }

    function showEditor(itemId, serverId) {
        return new Promise(function(resolve, reject) {
            closeAction = null, loading.show(), require(["text!./recordingcreator.template.html"], function(template) {
                function onRecordingChanged() {
                    reload(dlg, itemId, serverId, !0)
                }
                var dialogOptions = {
                    removeOnClose: !0,
                    scrollY: !1
                };
                layoutManager.tv ? dialogOptions.size = "fullscreen" : dialogOptions.size = "small";
                var dlg = dialogHelper.createDialog(dialogOptions);
                dlg.classList.add("formDialog"), dlg.classList.add("recordingDialog");
                var html = "";
                html += globalize.translateDocument(template, "sharedcomponents"), dlg.innerHTML = html, currentDialog = dlg, dlg.addEventListener("close", function() {
                    events.off(currentRecordingFields, "recordingchanged", onRecordingChanged), executeCloseAction(closeAction, itemId, serverId), currentRecordingFields && currentRecordingFields.hasChanged() ? resolve() : reject()
                }), layoutManager.tv && scrollHelper.centerFocus.on(dlg.querySelector(".formDialogContent"), !1), init(dlg), reload(dlg, itemId, serverId), currentRecordingFields = new recordingFields({
                    parent: dlg.querySelector(".recordingFields"),
                    programId: itemId,
                    serverId: serverId
                }), events.on(currentRecordingFields, "recordingchanged", onRecordingChanged), dialogHelper.open(dlg)
            })
        })
    }
    var currentDialog, closeAction, currentRecordingFields;
    return {
        show: showEditor
    }
});