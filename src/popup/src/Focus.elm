port module Focus exposing (..)

import Html exposing (Html, div, h1, h2, h3, input, label, option, select, text)
import Html.Attributes exposing (attribute, checked, class, for, id, placeholder, selected, style, type_, value)
import Html.Events exposing (..)
import Json.Decode as JD
import Json.Encode as JE



{------------------------------
 -
 - Model
 -
 ------------------------------}


type alias Model =
    { focus : Bool }


init : Model
init =
    Model True



{------------------------------
 -
 - port
 -
 ------------------------------}


port setFocus : JE.Value -> Cmd msg


port getFocus : () -> Cmd msg


port gotFocus : (JE.Value -> msg) -> Sub msg



{------------------------------
  -
  - Msg
  -
  ------------------------------}


type Msg
    = GotFocus JE.Value
    | CBChange Bool



{------------------------------
 -
 - Update
 -
 ------------------------------}


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        GotFocus valueJE ->
            case JD.decodeValue modelDecoder valueJE of
                Ok updateMdl ->
                    ( updateMdl, Cmd.none )

                Err _ ->
                    ( model, Cmd.none )

        CBChange b ->
            ( model, setFocus <| JE.object [ ( "focus", JE.bool b ) ] )



{------------------------------
 -
 - subscriptions
 -
 ------------------------------}


subscriptions : Sub Msg
subscriptions =
    Sub.batch [ gotFocus GotFocus ]



{------------------------------
 -
 - View
 -
 ------------------------------}


view : Model -> Html Msg
view model =
    div [ class "setting_wrapper" ]
        [ h2 [] [ text "Window Focus" ]
        , div [ class "description" ]
            [ text "If a recognized window exists, when next translate , window focused. "
            , text "This setting has no effect when the popup window opens.(The newly opened window will be focused.)"
            ]
        , div [ class "setting_values_wrapper" ]
            [ checkBox model.focus ]
        ]


popupView : Model -> Html Msg
popupView model =
    div [ class "context_menu_wrapper" ]
        [ h2 [] [ text "Window Focus" ]
        , div [ class "context_wrapper" ]
            [ checkBox model.focus ]
        ]


checkBox : Bool -> Html Msg
checkBox b =
    div [ class "check_wrapper" ]
        [ input [ type_ "checkbox", id "focus", checked b, onCheck CBChange ] []
        , label [ for "focus" ] [ text "Focus" ]
        ]



{------------------------------
 -
 - Json Decoder
 -
 ------------------------------}


modelDecoder : JD.Decoder Model
modelDecoder =
    JD.map Model
        (JD.field "focus" JD.bool)
