port module Main exposing (main)

import Browser
import Form.Decoder as FD
import Html exposing (Html, button, div, h1, h2, input, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (onClick, onInput)
import Json.Decode as JD
import Json.Encode as JE
import Task



{------------------------------
 -
 - Main
 -
 ------------------------------}


main : Program () Model Msg
main =
    Browser.document
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }



{------------------------------
 -
 - Model
 -
 ------------------------------}


type alias Model =
    { current : WindowSetting
    , userinput : UserInputSetting
    , validinput : Maybe WindowSetting
    , windowSettingFormError : List WindowSettingFormError
    , submitResult : SubmitResult
    }


type alias WindowSetting =
    { top : Maybe Int
    , left : Maybe Int
    , width : Maybe Int
    , height : Maybe Int
    }


type alias UserInputSetting =
    { top : String
    , left : String
    , width : String
    , height : String
    }


settingInit : WindowSetting
settingInit =
    { top = Nothing
    , left = Nothing
    , width = Just 0
    , height = Just 0
    }


type alias SubmitResult =
    { color : String
    , message : String
    }



{------------------------------
 -
 - Init
 -
 ------------------------------}


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = settingInit
      , userinput =
            case FD.run userInputDecoder settingInit of
                Ok userinput ->
                    userinput

                Err _ ->
                    { top = "", left = "", width = "", height = "" }
      , validinput = Nothing
      , windowSettingFormError = []
      , submitResult = SubmitResult "black" ""
      }
    , getWindowSetting ()
    )



{------------------------------
 -
 - Msg
 -
 ------------------------------}


type Msg
    = InitCurrentValue
    | GotWindowSettingForCurrent JE.Value
    | GotWindowSetting JE.Value
    | InputChange InputMsg String
    | DecodeUserInput DecodeMsg
    | SubmitWindowSetting SubmitSettingMsg
    | GotResultSetWindowSetting JE.Value


type InputMsg
    = TopChange
    | LeftChange
    | WidthChange
    | HeightChange


type DecodeMsg
    = TryDecodeWindowSetting


type SubmitSettingMsg
    = Submit
    | SubmitError
    | SubmitSuccess



{------------------------------
 -
 - Task
 -
 ------------------------------}


decodeCmd : DecodeMsg -> Cmd Msg
decodeCmd msgDecode =
    Task.succeed msgDecode
        |> Task.perform DecodeUserInput



{------------------------------
 -
 - Update
 -
 ------------------------------}


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        InitCurrentValue ->
            ( { model | submitResult = SubmitResult "black" "" }, getWindowSettingForCurrent () )

        GotWindowSettingForCurrent raw ->
            ( case JD.decodeValue windowSettingJsonDecoder raw of
                Ok ws ->
                    { model | current = ws }

                Err err ->
                    { model | submitResult = SubmitResult "red" <| JD.errorToString err }
            , decodeCmd TryDecodeWindowSetting
            )

        GotWindowSetting raw ->
            ( case JD.decodeValue windowSettingJsonDecoder raw of
                Ok ws ->
                    { model
                        | current = ws
                        , userinput =
                            case FD.run userInputDecoder ws of
                                Ok userinput ->
                                    userinput

                                Err _ ->
                                    { top = "", left = "", width = "", height = "" }
                    }

                Err err ->
                    { model | submitResult = SubmitResult "red" <| JD.errorToString err }
            , decodeCmd TryDecodeWindowSetting
            )

        InputChange inputmsg userInputString ->
            let
                userinput =
                    model.userinput

                trydecode =
                    decodeCmd TryDecodeWindowSetting
            in
            case inputmsg of
                TopChange ->
                    ( { model | userinput = { userinput | top = userInputString } }, trydecode )

                LeftChange ->
                    ( { model | userinput = { userinput | left = userInputString } }, trydecode )

                WidthChange ->
                    ( { model | userinput = { userinput | width = userInputString } }, trydecode )

                HeightChange ->
                    ( { model | userinput = { userinput | height = userInputString } }, trydecode )

        DecodeUserInput decodeMsg ->
            case decodeMsg of
                TryDecodeWindowSetting ->
                    case FD.run windowSettingDecoder model.userinput of
                        Ok ws ->
                            ( { model | windowSettingFormError = [], validinput = Just ws }, Cmd.none )

                        Err err ->
                            ( { model | windowSettingFormError = err, validinput = Nothing }, Cmd.none )

        SubmitWindowSetting submitSettingMsg ->
            case submitSettingMsg of
                Submit ->
                    case model.validinput of
                        Just windowSetting ->
                            ( { model | submitResult = SubmitResult "black" "Submit..." }, setWindowSetting <| windowSettingJsonEncoder windowSetting )

                        Nothing ->
                            ( { model | submitResult = SubmitResult "black" "" }, Cmd.none )

                SubmitError ->
                    ( model, Cmd.none )

                SubmitSuccess ->
                    ( model, Cmd.none )

        GotResultSetWindowSetting result ->
            case JD.decodeValue windowSettingResultDecoder result of
                Ok _ ->
                    ( { model | submitResult = SubmitResult "green" "Submit Success" }, getWindowSetting () )

                Err error ->
                    ( { model | submitResult = SubmitResult "red" <| JD.errorToString error }, Cmd.none )



{------------------------------
 -
 - Subscriptions
 -
 ------------------------------}


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ gotWindowSetting GotWindowSetting
        , gotResultSetWindowSetting GotResultSetWindowSetting
        , gotWindowSettingForCurrent GotWindowSettingForCurrent
        ]



{------------------------------
 -
 - View
 -
 ------------------------------}


view : Model -> Browser.Document Msg
view model =
    { title = "Options"
    , body =
        [ div [ class "option_wrapper" ]
            [ h1 [] [ text "Options" ]
            , currentSetting model.current
            , div [ class "status_button_wrapper" ]
                [ div [ class "buttons_wrapper" ]
                    [ button [ onClick <| InitCurrentValue ] [ text "GetCurrenttValue" ]
                    ]
                ]
            , userInputSetting model.windowSettingFormError model.userinput
            , div [ class "status_button_wrapper" ]
                [ div [ class "submit_status", style "color" model.submitResult.color ] [ text model.submitResult.message ]
                , div [ class "buttons_wrapper" ]
                    [ button
                        [ case model.validinput of
                            Just _ ->
                                onClick <| SubmitWindowSetting Submit

                            Nothing ->
                                attribute "UnableSubmit" "true"
                        ]
                        [ text "Submit" ]
                    ]
                ]
            ]
        ]
    }


currentSetting : WindowSetting -> Html msg
currentSetting ws =
    let
        ws_list =
            [ ws.top, ws.left, ws.width, ws.height ]

        label_list =
            [ "top", "left", "width", "height" ]

        setting_list_div =
            List.map2 Tuple.pair label_list ws_list
                |> List.map
                    (\( label, val ) ->
                        div [ class "form_wrapper" ]
                            [ div [ class "form_div" ]
                                [ text <|
                                    label
                                        ++ " :"
                                , div [ class "value" ]
                                    [ text <|
                                        case val of
                                            Just i ->
                                                String.fromInt i

                                            Nothing ->
                                                "Default"
                                    ]
                                ]
                            ]
                    )
    in
    div [ class "setting_wrapper" ] <|
        [ h2 [] [ text "Current Window Setting Value" ]
        , div [ class "setting_values_wrapper" ] setting_list_div
        ]


userInputSetting : List WindowSettingFormError -> UserInputSetting -> Html Msg
userInputSetting errs uis =
    let
        labelList =
            [ "top", "left", "width", "height" ]

        wsElemList =
            [ uis.top, uis.left, uis.width, uis.height ]

        msgList =
            [ TopChange, LeftChange, WidthChange, HeightChange ]

        errList =
            [ TopError, LeftError, WidthError, HeightError ]

        createDiv : String -> String -> InputMsg -> (SettingInputError -> WindowSettingFormError) -> Html Msg
        createDiv label wsElem msg toWindowSettingFormError =
            div [ class "form_wrapper" ]
                [ div [ class "form_div" ]
                    [ text <| label ++ " : "
                    , input
                        [ value wsElem
                        , placeholder <|
                            if label == "top" || label == "left" then
                                "Initialize"

                            else
                                ""
                        , onInput <| InputChange msg
                        ]
                        []
                    ]
                , errsHtmlMsg errs toWindowSettingFormError
                ]

        setting_list_div =
            List.map4 createDiv labelList wsElemList msgList errList
    in
    div [ class "setting_wrapper" ] <|
        [ h2 [] [ text "User Input Setting Value" ]
        , div [ class "setting_values_wrapper" ] setting_list_div
        ]


errCmp : WindowSettingFormError -> (SettingInputError -> WindowSettingFormError) -> Bool
errCmp err toWindowSettingFormError =
    case err of
        TopError inrerr ->
            err == toWindowSettingFormError inrerr

        LeftError inrerr ->
            err == toWindowSettingFormError inrerr

        WidthError inrerr ->
            err == toWindowSettingFormError inrerr

        HeightError inrerr ->
            err == toWindowSettingFormError inrerr


errPick : WindowSettingFormError -> SettingInputError
errPick err =
    case err of
        TopError settingInputError ->
            settingInputError

        LeftError settingInputError ->
            settingInputError

        WidthError settingInputError ->
            settingInputError

        HeightError settingInputError ->
            settingInputError


errFilter : List WindowSettingFormError -> (SettingInputError -> WindowSettingFormError) -> List WindowSettingFormError
errFilter errs toWindowSettingFormError =
    List.filter
        (\err ->
            errCmp err toWindowSettingFormError
        )
        errs


errsHtmlMsg : List WindowSettingFormError -> (SettingInputError -> WindowSettingFormError) -> Html Msg
errsHtmlMsg errs toWindowSettingFormError =
    let
        errdiv : SettingInputError -> Html msg
        errdiv inputerr =
            case inputerr of
                InvalidInput ->
                    div [ class "form_err" ] [ text "InvalidInput" ]

                TooSmall ->
                    div [ class "form_err" ] [ text "TooSmall!" ]
    in
    errFilter errs toWindowSettingFormError
        |> List.map (errPick >> errdiv)
        |> div [ class "form_errs" ]



{------------------------------
 -
 - Ports
 -
 ------------------------------}


port getWindowSettingForCurrent : () -> Cmd msg


port gotWindowSettingForCurrent : (JE.Value -> msg) -> Sub msg


port getWindowSetting : () -> Cmd msg


port gotWindowSetting : (JE.Value -> msg) -> Sub msg


port setWindowSetting : JE.Value -> Cmd msg


port gotResultSetWindowSetting : (JE.Value -> msg) -> Sub msg



{------------------------------
 -
 - Json Decoder
 -
 ------------------------------}


windowSettingJsonDecoder : JD.Decoder WindowSetting
windowSettingJsonDecoder =
    JD.map4 WindowSetting
        (JD.maybe <| JD.field "top" JD.int)
        (JD.maybe <| JD.field "left" JD.int)
        (JD.maybe <| JD.field "width" JD.int)
        (JD.maybe <| JD.field "height" JD.int)


statusDecoder : String -> JD.Decoder ()
statusDecoder status =
    case status of
        "Success" ->
            JD.succeed ()

        "Failure" ->
            JD.fail "Failure Set"

        _ ->
            JD.fail "Decoder Error"


windowSettingResultDecoder : JD.Decoder ()
windowSettingResultDecoder =
    JD.field "status" JD.string |> JD.andThen statusDecoder



{------------------------------
 -
 - Json Encoder
 -
 ------------------------------}


windowSettingJsonEncoder : WindowSetting -> JE.Value
windowSettingJsonEncoder windowSetting =
    let
        settingList =
            [ ( "top", windowSetting.top )
            , ( "left", windowSetting.left )
            , ( "width", windowSetting.width )
            , ( "height", windowSetting.height )
            ]
    in
    settingList
        |> List.filterMap
            (\( key, intMaybe ) ->
                Maybe.map (\i -> ( key, JE.int i )) intMaybe
            )
        |> JE.object



{------------------------------
 -
 - Setting Form  Decoder
 -
 ------------------------------}


type WindowSettingFormError
    = TopError SettingInputError
    | LeftError SettingInputError
    | WidthError SettingInputError
    | HeightError SettingInputError


type SettingInputError
    = InvalidInput
    | TooSmall



-- WindowSetting -> UserInputSetting


maybeIntDecoder : FD.Decoder (Maybe Int) () String
maybeIntDecoder =
    FD.with <|
        \maybeInt ->
            case maybeInt of
                Just i ->
                    FD.always <| String.fromInt i

                Nothing ->
                    FD.always ""


userInputDecoder : FD.Decoder WindowSetting () UserInputSetting
userInputDecoder =
    FD.top UserInputSetting
        |> FD.field (FD.lift .top maybeIntDecoder)
        |> FD.field (FD.lift .left maybeIntDecoder)
        |> FD.field (FD.lift .width maybeIntDecoder)
        |> FD.field (FD.lift .height maybeIntDecoder)



-- UserInputSetting -> WindowSetting
-- AllowEmpty Flag is WindowSetting Default Value (top, left)


stringToMaybeInt : Bool -> (SettingInputError -> WindowSettingFormError) -> FD.Decoder String WindowSettingFormError (Maybe Int)
stringToMaybeInt allowEmpty toWindowSettingFormError =
    FD.mapError toWindowSettingFormError <|
        FD.with <|
            \str ->
                case str of
                    "" ->
                        if allowEmpty then
                            FD.always Nothing

                        else
                            FD.int InvalidInput |> FD.map (\i -> Just i)

                    _ ->
                        FD.int InvalidInput |> FD.map (\i -> Just i)


maybeMinBound : Int -> (SettingInputError -> WindowSettingFormError) -> FD.Validator (Maybe Int) WindowSettingFormError
maybeMinBound i toWindowSettingFormError =
    FD.mapError toWindowSettingFormError <|
        FD.custom <|
            \nMaybe ->
                case nMaybe of
                    Just n ->
                        if n < i then
                            Err [ TooSmall ]

                        else
                            Ok ()

                    Nothing ->
                        Ok ()


windowSettingDecoder : FD.Decoder UserInputSetting WindowSettingFormError WindowSetting
windowSettingDecoder =
    FD.top WindowSetting
        |> FD.field (FD.lift .top <| stringToMaybeInt True TopError)
        |> FD.field (FD.lift .left <| stringToMaybeInt True LeftError)
        |> FD.field
            (FD.lift .width <|
                (stringToMaybeInt False WidthError
                    |> FD.assert (maybeMinBound 1 WidthError)
                )
            )
        |> FD.field
            (FD.lift .height <|
                (stringToMaybeInt False HeightError
                    |> FD.assert (maybeMinBound 1 HeightError)
                )
            )
