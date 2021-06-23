module Main exposing (main)

import Browser
import Html exposing (Html, button, div, h1, h2, input, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (onClick, onInput)
import Language



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
    { translateLanguage : Language.Model }



{------------------------------
 -
 - init
 -
 ------------------------------}


init : () -> ( Model, Cmd Msg )
init _ =
    ( { translateLanguage = Language.init }, Cmd.batch [ Language.getLanguage () ] )



{------------------------------
 -
 - Msg
 -
 ------------------------------}


type Msg
    = LanguageMsg Language.Msg



{------------------------------
 -
 - Update
 -
 ------------------------------}


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LanguageMsg langMsg ->
            let
                ( langModel, langCmd ) =
                    Language.update langMsg model.translateLanguage
            in
            ( { model | translateLanguage = langModel }, Cmd.map LanguageMsg langCmd )



{------------------------------
 -
 - subscriptions
 -
 ------------------------------}


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ Sub.map LanguageMsg Language.subscriptions ]



{------------------------------
 -
 - view
 -
 ------------------------------}


view : Model -> Browser.Document Msg
view model =
    { title = "PopupMenu"
    , body =
        [ div [ class "popup_wrapper" ] [ Html.map LanguageMsg <| Language.popupView model.translateLanguage ] ]
    }
